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

/* Fare hareketine göre arkaplan parıltılarında hafif paralaks + takip eden ışık */
const bgOrbs = $('.bg-orbs');
const root = document.documentElement;
if (bgOrbs && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('mousemove', (e) => {
    const px = (e.clientX / window.innerWidth - 0.5);
    const py = (e.clientY / window.innerHeight - 0.5);
    bgOrbs.style.transform = `translate(${px * -24}px, ${py * -24}px)`;
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  });
}

/* Header scroll efekti + ilerleme çubuğu */
const scrollProgress = $('#scroll-progress');
window.addEventListener('scroll', () => {
  $('#header').classList.toggle('scrolled', window.scrollY > 20);
  if (scrollProgress) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    scrollProgress.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
  }
});

/* Yüklenirken iskelet kartlar göster */
function renderSkeletons(count = 6) {
  masonry.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'card skeleton-card';
    sk.style.height = (180 + (i % 3) * 60) + 'px';
    masonry.appendChild(sk);
  }
}

/* Verileri yükle — Turso backend'den (Netlify Function) */
async function loadDesigns() {
  renderSkeletons();
  try {
    const res = await fetch('/api/designs', { cache: 'no-store' });
    if (!res.ok) throw new Error('no data');
    const data = await res.json();
    DESIGNS = Array.isArray(data) ? data : (data.items || []);
  } catch {
    DESIGNS = [];
  }
  finishLoad();
}

function finishLoad() {
  // API zaten id DESC (en yeni önce) döndürür
  render();
  animateCount(DESIGNS.length);
}

/* Medya tipi tespiti */
function isVideo(file) { return /\.(mp4|webm|mov)$/i.test(file); }

/* Kart oluştur */
function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.transitionDelay = (index % 9) * 0.06 + 's';
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
  card.addEventListener('mousemove', handleCardTilt);
  card.addEventListener('mouseleave', resetCardTilt);
  return card;
}

/* Kart tilt (fare pozisyonuna göre 3D eğim) */
function handleCardTilt(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const maxTilt = 8;
  card.style.setProperty('--tilt-y', ((px - 0.5) * maxTilt * 2) + 'deg');
  card.style.setProperty('--tilt-x', (-(py - 0.5) * maxTilt * 2) + 'deg');
}
function resetCardTilt(e) {
  const card = e.currentTarget;
  card.style.setProperty('--tilt-x', '0deg');
  card.style.setProperty('--tilt-y', '0deg');
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
  visibleList.forEach((item, i) => {
    const card = buildCard(item, i);
    masonry.appendChild(card);
    cardObserver.observe(card);
  });
}

/* Kartlar ekrana girince belirsin */
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); cardObserver.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

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
