/* ===== Xentora Admin Panel ===== */

// --- Sabit giriş bilgisi ---
const AUTH = { user: 'ozantaskin1491', pass: 'Oozan4651.' };
const SESSION_KEY = 'xentora_admin_session';
const STORE_KEY = 'xentora_designs';

const $ = (s) => document.querySelector(s);

/* ================= GİRİŞ ================= */
const loginScreen = $('#login-screen');
const panel = $('#panel');

function showPanel() {
  loginScreen.hidden = true;
  panel.hidden = false;
  loadDesigns();
}

// Oturum hatırla
if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
  showPanel();
}

$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = $('#username').value.trim();
  const p = $('#password').value;
  if (u === AUTH.user && p === AUTH.pass) {
    sessionStorage.setItem(SESSION_KEY, 'ok');
    showPanel();
  } else {
    const err = $('#login-error');
    err.hidden = false;
    err.style.animation = 'none';
    void err.offsetWidth;
    err.style.animation = 'shake .4s';
  }
});

$('#logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

/* ================= VERİ ================= */
// Tam liste localStorage'da tutulur. İlk açılışta data/designs.json'dan tohumlanır.
let designs = [];

async function loadDesigns() {
  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try { designs = JSON.parse(stored); } catch { designs = []; }
  } else {
    // İlk kez: yayındaki json'dan al
    try {
      const res = await fetch('../data/designs.json?v=' + Date.now());
      const data = await res.json();
      designs = Array.isArray(data) ? data : (data.items || []);
    } catch { designs = []; }
    save();
  }
  renderList();
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(designs));
}

/* ================= EKLEME ================= */
const fileInput = $('#d-file');
const dropzone = $('#dropzone');
const dzInner = $('#dropzone-inner');
const previewImg = $('#preview-img');
let currentImageData = null;

dropzone.addEventListener('click', () => fileInput.click());

['dragover', 'dragenter'].forEach(ev =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) { toast('Lütfen bir resim/GIF seç'); return; }
  if (file.size > 6 * 1024 * 1024) {
    toast('Dosya 6MB üstü — daha küçük bir görsel öner.');
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageData = e.target.result; // data URL
    previewImg.src = currentImageData;
    previewImg.hidden = false;
    dzInner.hidden = true;
  };
  reader.readAsDataURL(file);
}

$('#add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#d-title').value.trim();
  const category = $('#d-category').value;
  if (!currentImageData) { toast('Önce bir görsel yükle'); return; }

  designs.unshift({
    title,
    category,
    image: currentImageData,
    date: new Date().toISOString().slice(0, 10)
  });
  save();
  renderList();
  toast('Tasarım eklendi ✓');

  // formu sıfırla
  e.target.reset();
  currentImageData = null;
  previewImg.hidden = true;
  previewImg.src = '';
  dzInner.hidden = false;
});

/* ================= LİSTE ================= */
function renderList() {
  const list = $('#design-list');
  const empty = $('#list-empty');
  $('#count-badge').textContent = designs.length;
  list.innerHTML = '';

  if (designs.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  designs.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'design-item';
    const src = resolveSrc(d.image);
    const isVid = /\.(mp4|webm|mov)$/i.test(d.image) && !d.image.startsWith('data:');
    const media = isVid
      ? `<video src="${src}" muted></video>`
      : `<img src="${src}" alt="" />`;
    item.innerHTML = `
      ${media}
      <div class="design-meta">
        <div class="t">${escapeHtml(d.title || 'İsimsiz')}</div>
        <div class="c">${escapeHtml(d.category || '')}</div>
      </div>
      <button class="design-del" data-i="${i}" title="Sil">🗑</button>
    `;
    list.appendChild(item);
  });
}

$('#design-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.design-del');
  if (!btn) return;
  if (!confirm('Bu tasarımı silmek istediğine emin misin?')) return;
  designs.splice(+btn.dataset.i, 1);
  save();
  renderList();
  toast('Silindi');
});

/* ================= YAYINLA (designs.json indir) ================= */
$('#publish-btn').addEventListener('click', () => {
  const json = JSON.stringify({ items: designs }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'designs.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('designs.json indirildi → data/ klasörüne koy');
});

/* ================= Yardımcı ================= */
// admin/ altındayız; göreli dosya yollarını bir üst klasöre çöz
function resolveSrc(img) {
  if (!img) return '';
  if (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/')) return img;
  return '../' + img;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

let toastTimer;
function toast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
