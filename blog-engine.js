/**
 * Blog Engine - Premium Notion-Style Feed
 * handles post fetching, search, filtering, infinite scroll, and immersive modals.
 * Version: 2.3 (Protocol Detection & Debug Ready)
 */

(function () {
    let allPosts = [];
    let filteredPosts = [];
    let currentPage = 1;
    const postsPerPage = 6;
    let currentFilter = 'all';

    // Global references
    let postGrid, searchInput, filterChips, modal, modalContent, closeModal;

    // --- On-page Debugging Helper ---
    function showErrorOnPage(msg, submsg) {
        if (!postGrid) postGrid = document.getElementById('postGrid');
        if (postGrid) {
            postGrid.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #fff1f2; border: 1px solid #fecaca; border-radius: 16px; margin: 20px 0;">
                    <h3 style="color: #991b1b; margin-bottom: 8px;">Ocurrió un problema</h3>
                    <p style="color: #b91c1c; font-weight: 500;">${msg}</p>
                    ${submsg ? `<p style="color: #7f1d1d; font-size: 0.9rem; margin-top: 12px; opacity: 0.8;">${submsg}</p>` : ''}
                </div>`;
        }
    }

    function init() {
        console.log('Blog Engine initializing...');
        postGrid = document.getElementById('postGrid');
        searchInput = document.getElementById('searchInput');
        filterChips = document.querySelectorAll('.chip');
        modal = document.getElementById('postPreviewModal');
        modalContent = document.getElementById('modalBody');

        if (!modal) {
            console.warn('Modal element #postPreviewModal not found in DOM.');
        } else {
            closeModal = modal.querySelector('.close-modal');
        }

        // --- Protocol Check ---
        if (window.location.protocol === 'file:') {
            showErrorOnPage(
                'El navegador bloquea la carga de datos al abrir el archivo directamente.',
                'Para que el blog funcione, debes abrir tu carpeta en VS Code y usar "Live Server", o subirlo a un servidor real. Los navegadores por seguridad no permiten cargar archivos JSON desde rutas locales (file://).'
            );
            return;
        }

        // --- Event Delegation ---
        if (postGrid) {
            postGrid.addEventListener('click', (e) => {
                const trigger = e.target.closest('.post-thumb, .post-title, .btn-preview');
                if (trigger) {
                    const card = trigger.closest('.post-card');
                    if (card && card.dataset.id) {
                        e.preventDefault();
                        e.stopPropagation();
                        openPreview(card.dataset.id);
                    }
                }
            });
        }

        if (searchInput) searchInput.addEventListener('input', applyFilters);

        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.dataset.active = "false");
                chip.dataset.active = "true";
                currentFilter = chip.dataset.filter;
                applyFilters();
            });
        });

        if (closeModal) closeModal.addEventListener('click', closePreview);

        window.addEventListener('click', (event) => {
            if (event.target === modal) closePreview();
        });

        window.addEventListener('scroll', handleInfiniteScroll);

        fetchPosts();
    }

    async function fetchPosts() {
        try {
            const response = await fetch('posts.json');
            if (!response.ok) throw new Error(`Error de red: ${response.status}`);
            allPosts = await response.json();
            filteredPosts = [...allPosts];
            renderFeed();
        } catch (error) {
            console.error('Error loading posts:', error);
            showErrorOnPage(
                'No se pudieron cargar las entradas del blog.',
                `Error: ${error.message}. Verifica que posts.json exista en la misma carpeta.`
            );
        }
    }

    function renderFeed(append = false) {
        if (!postGrid) return;
        if (!append) postGrid.innerHTML = '';

        const start = (currentPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const pagePosts = filteredPosts.slice(start, end);

        if (pagePosts.length === 0 && !append) {
            postGrid.innerHTML = `<div style="text-align:center; padding:60px; color: var(--text-muted);">No se encontraron resultados para esta categoría.</div>`;
            return;
        }

        pagePosts.forEach(post => {
            const card = createPostCard(post);
            postGrid.appendChild(card);
        });

        setTimeout(() => {
            document.querySelectorAll('.post-card.new').forEach(card => {
                card.classList.remove('new');
                card.classList.add('reveal');
            });
        }, 50);
    }

    function createPostCard(post) {
        const article = document.createElement('article');
        article.className = 'post-card new';
        article.dataset.id = post.id;

        const dateFormatted = formatDate(post.date);

        article.innerHTML = `
            <div class="post-thumb">
                <img src="../${post.image}" alt="${post.title}" loading="lazy" onerror="this.src='../assets/hero-home.png'" />
            </div>
            <div class="post-info">
                <div class="post-meta">
                    <span class="pill" style="background: rgba(22, 96, 136, 0.1); color: var(--primary);">${(post.category || 'VARIOS').toUpperCase()}</span>
                    <span class="muted" style="font-size: 0.85rem;">${dateFormatted}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-footer">
                   <div class="author-info">
                      <div style="width: 24px; height: 24px; background: var(--bg-alt); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: var(--primary);">
                        ${(post.author || 'Á').charAt(0)}
                      </div>
                      <span class="author-name">${post.author || 'Ángel'}</span>
                   </div>
                   <div class="post-actions">
                      <button class="btn-preview">Vista Previa</button>
                      <a href="${post.url}" class="btn-read-more">Leer</a>
                   </div>
                </div>
            </div>
        `;
        return article;
    }

    function applyFilters() {
        const query = (searchInput ? searchInput.value : '').toLowerCase();
        filteredPosts = allPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                (post.tags && post.tags.some(t => String(t).toLowerCase().includes(query)));
            const matchesFilter = currentFilter === 'all' || post.category === currentFilter;
            return matchesSearch && matchesFilter;
        });
        currentPage = 1;
        renderFeed();
    }

    function openPreview(id) {
        const post = allPosts.find(p => String(p.id) === String(id));
        if (!post) return;

        if (modalContent) {
            const dateFormatted = formatDate(post.date);
            modalContent.innerHTML = `
                <div class="modal-scroll-area">
                    <div class="modal-header-hero">
                        <img src="../${post.image}" alt="${post.title}" onerror="this.src='../assets/hero-home.png'" />
                    </div>
                    <div class="modal-content-body">
                        <span class="modal-category">${(post.category || 'ENTRADA').toUpperCase()}</span>
                        <h2 class="modal-title">${post.title}</h2>
                        <div class="modal-meta-bar">
                            <div class="author-info">
                                <span class="author-name">${post.author}</span>
                            </div>
                            <span>•</span>
                            <span>${dateFormatted}</span>
                        </div>
                        <p class="modal-preview-text" style="white-space: pre-wrap;">${post.excerpt}</p>
                        <div class="modal-footer-actions">
                            <a href="${post.url}" class="btn btn-primary" style="padding:16px 40px; text-decoration:none; color:#fff; border-radius:12px; font-weight:700;">Leer entrada completa</a>
                        </div>
                    </div>
                </div>`;
        }

        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closePreview() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function handleInfiniteScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
            if (filteredPosts.length > currentPage * postsPerPage) {
                currentPage++;
                renderFeed(true);
            }
        }
    }

    function formatDate(d) {
        try {
            const date = new Date(d);
            if (isNaN(date.getTime())) return d;
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) { return d; }
    }

    // Export to global for any manual calls
    window.openPreview = openPreview;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
