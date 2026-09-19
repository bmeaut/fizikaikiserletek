// Generate QR codes for every .qr-canvas element that has a data-url attribute.
// QRCode.js must be loaded before this script.
document.querySelectorAll('.qr-canvas[data-url]').forEach((canvas) => {
  new QRCode(canvas, {
    text: canvas.dataset.url,
    width: 128,
    height: 128,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
});

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
