const fs = require('fs');
const path = require('path');

const BLOG_DIR = __dirname;
const POSTS_DIR = path.join(BLOG_DIR, 'entradas-blog');
const JSON_FILE = path.join(BLOG_DIR, 'posts.json');

/**
 * Scans the entries folder and updates posts.json based on metadata in comments.
 * metadata format in HTML: <!-- blog-meta: { "title": "...", "excerpt": "...", ... } -->
 */
function updatePosts() {
    console.log('--- Actualizando base de datos de blog ---');

    if (!fs.existsSync(POSTS_DIR)) {
        console.error('La carpeta de entradas-blog no existe.');
        return;
    }

    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));
    const posts = [];

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract metadata from comment
        const metaMatch = content.match(/<!-- blog-meta:\s*({.*?})\s*-->/s);

        if (metaMatch) {
            try {
                const meta = JSON.parse(metaMatch[1]);
                posts.push({
                    id: file.replace('.html', ''),
                    url: `entradas-blog/${file}`,
                    ...meta
                });
                console.log(`[OK] Procesado: ${file}`);
            } catch (e) {
                console.error(`[ERROR] Metadata inválida en ${file}:`, e.message);
            }
        } else {
            console.warn(`[SKIP] No se encontró metadata en ${file}. Usa <!-- blog-meta: { ... } -->`);
        }
    });

    // Sort by date (descending)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(JSON_FILE, JSON.stringify(posts, null, 2));
    console.log(`--- Éxito: ${posts.length} entradas indexadas ---`);
}

updatePosts();
