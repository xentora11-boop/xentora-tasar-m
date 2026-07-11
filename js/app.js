/* ===== Xentora Design — Galeri Motoru ===== */

let DESIGNS = [];
let currentFilter = 'all';
let lightboxIndex = 0;
let visibleList = [];

const $ = (s) => document.querySelector(s);
const masonry = $('#masonry');
const emptyState = $('#empty-state');

/* Yıl */
$('#year').textContent = new Date().getFullYear();

/* Header scroll efekti */
window.addEventListener('scroll', () => {
  $('#header').classList.toggle('scrolled', window.scrollY > 20);
});

/* Verileri yükle */
async function loadDesigns() {
  // Admin panelinden bu tarayıcıda eklenenler anında görünsün
  const local = localStorage.getItem('xentora_designs');
  if (local) {
    try {
      const arr = JSON.parse(local);
      if (Array.isArray(arr) && arr.length) { DESIGNS = arr; finishLoad(); return; }
    } catch { /* yoksay */ }
  }
  try {
    const res = await fetch('data/designs.json?v=' + Date.now());
    if (!res.ok) throw new Error('no data');
    const data = await res.json();
    // Admin panel {items:[...]} olarak kaydeder; düz dizi de desteklenir
    DESIGNS = Array.isArray(data) ? data : (data.items || []);
  } catch {
    DESIGNS = [];
  }
  finishLoad();
}

function finishLoad() {
  // En yeni önce
  DESIGNS.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  render();
  animateCount(DESIGNS.length);
}

/* Medya tipi tespiti */
function isVideo(file) { return /\.(mp4|webm|mov)$/i.test(file); }

/* Kart oluştur */
function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = (index % 9) * 0.05 + 's';
  card.dataset.index = index;

  const media = document.createElement('div');
  media.className = 'card-media';

  if (isVideo(item.image)) {
    const v = document.createElement('video');
    v.src = item.image;
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    media.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || 'Tasarım';
    img.loading = 'lazy';
    media.appendChild(img);
  }

  const cat = (item.category || '').toLowerCase();
  const badge = (cat === 'gif' || /\.gif$/i.test(item.image) || isVideo(item.image))
    ? '<span class="card-badge-gif">● GIF</span>' : '';

  card.innerHTML = badge;
  card.appendChild(media);

  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';
  overlay.innerHTML = `
    <div class="card-title">${escapeHtml(item.title || 'İsimsiz')}</div>
    ${item.category ? `<span class="card-cat">${escapeHtml(item.category)}</span>` : ''}
  `;
  card.appendChild(overlay);

  card.addEventListener('click', () => openLightbox(index));
  return card;
}

/* Render */
function render() {
  visibleList = DESIGNS.filter(d => {
    if (currentFilter === 'all') return true;
    return (d.category || '').toLowerCase() === currentFilter;
  });

  masonry.innerHTML = '';
  if (visibleList.length === 0) {
    emptyState.hidden = DESIGNS.length !== 0 ? true : false;
    // Filtre sonucu boşsa farklı mesaj yerine sadece gizle/göster
    emptyState.hidden = !(DESIGNS.length === 0);
    if (DESIGNS.length > 0) {
      masonry.innerHTML = '<p style="color:var(--text-dim);text-align:center;grid-column:1/-1;">Bu kategoride tasarım yok.</p>';
    }
    return;
  }
  emptyState.hidden = true;
  visibleList.forEach((item, i) => masonry.appendChild(buildCard(item, i)));
}

/* Filtreler */
$('#filters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  render();
});

/* ===== Lightbox ===== */
const lightbox = $('#lightbox');
const lbContent = $('#lightbox-content');
const lbCaption = $('#lightbox-caption');

function openLightbox(index) {
  lightboxIndex = index;
  showLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}
function showLightbox() {
  const item = visibleList[lightboxIndex];
  if (!item) return;
  if (isVideo(item.image)) {
    lbContent.innerHTML = `<video src="${item.image}" controls autoplay loop muted playsinline></video>`;
  } else {
    lbContent.innerHTML = `<img src="${item.image}" alt="${escapeHtml(item.title || '')}" />`;
  }
  lbCaption.textContent = [item.title, item.category].filter(Boolean).join(' · ');
}
function closeLightbox() {
  lightbox.hidden = true;
  lbContent.innerHTML = '';
  document.body.style.overflow = '';
}
function navLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + visibleList.length) % visibleList.length;
  showLightbox();
}
$('#lightbox-close').addEventListener('click', closeLightbox);
$('#lightbox-prev').addEventListener('click', () => navLightbox(-1));
$('#lightbox-next').addEventListener('click', () => navLightbox(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

/* İstatistik sayaç animasyonu */
function animateCount(target) {
  const el = $('#stat-count');
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const t = setInterval(() => {
    cur += step;
    if (cur >= target) { cur = target; clearInterval(t); }
    el.textContent = cur;
  }, 30);
}

/* Yardımcı */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* Scroll reveal */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

loadDesigns();
