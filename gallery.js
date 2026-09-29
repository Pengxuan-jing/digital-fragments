(() => {
  const archive = document.querySelector('.photo-archive');
  if (!archive || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const photos = archive.querySelectorAll('.photo-item');
  if (!photos.length) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible', 'is-inview');
      } else {
        entry.target.classList.remove('is-inview');
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  archive.classList.add('photo-archive--reveal');
  photos.forEach((photo) => observer.observe(photo));
})();
