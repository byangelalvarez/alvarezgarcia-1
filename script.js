const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.querySelectorAll('[data-stagger]').forEach((grid) => {
  const children = Array.from(grid.children);
  children.forEach((child, index) => {
    child.style.transitionDelay = `${index * 120}ms`;
  });
});

const slider = document.querySelector('[data-slider]');
if (slider) {
  const track = slider.querySelector('.slider-track');
  const slides = Array.from(track.children);
  const prevBtn = document.querySelector('[data-direction="prev"]');
  const nextBtn = document.querySelector('[data-direction="next"]');
  let index = 0;
  let intervalId;

  const updateSlider = () => {
    const slideWidth = slides[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${index * (slideWidth + 24)}px)`;
  };

  const showNext = () => {
    index = (index + 1) % slides.length;
    updateSlider();
  };

  const showPrev = () => {
    index = (index - 1 + slides.length) % slides.length;
    updateSlider();
  };

  const startAutoplay = () => {
    intervalId = setInterval(showNext, 6000);
  };

  const stopAutoplay = () => {
    clearInterval(intervalId);
  };

  window.addEventListener('resize', updateSlider);
  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  updateSlider();
  startAutoplay();
}
