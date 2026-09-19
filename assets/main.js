// Generate QR codes using qrcode-generator library.
// Each .qr-canvas element with a data-url attribute gets an <img> inserted after it.
document.querySelectorAll('.qr-canvas[data-url]').forEach((canvas) => {
  const qr = qrcode(0, 'M');
  qr.addData(canvas.dataset.url);
  qr.make();

  const img = document.createElement('img');
  img.src = qr.createDataURL(4, 0);
  img.alt = 'QR-kód';
  img.width = 128;
  img.height = 128;
  img.style.borderRadius = '6px';
  img.addEventListener('click', () => openLightbox(img.src));
  canvas.replaceWith(img);
});

// ── QR lightbox ──────────────────────────────────────────────────────────
const lightbox = document.createElement('div');
lightbox.id = 'qr-lightbox';
const lightboxImg = document.createElement('img');
lightboxImg.alt = 'QR-kód nagyítva';
lightbox.appendChild(lightboxImg);
document.body.appendChild(lightbox);

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
}

lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('open');
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
