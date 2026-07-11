/* ===== Xentora Admin Panel — Turso backend ===== */

// Kullanici adi sadece arayuz kolayligi; asil guvenlik sunucudaki sifre (ADMIN_PASSWORD env).
const USERNAME = 'ozantaskin1491';
const SESSION_KEY = 'xentora_admin_pw';
const API = '/api/designs';

const $ = (s) => document.querySelector(s);

/* ================= GİRİŞ ================= */
const loginScreen = $('#login-screen');
const panel = $('#panel');

// Yazma isteklerinde gönderilecek şifre başlığı
function authHeaders(extra = {}) {
  return { 'x-admin-password': sessionStorage.getItem(SESSION_KEY) || '', ...extra };
}

function showPanel() {
  loginScreen.hidden = true;
  panel.hidden = false;
  loadDesigns();
}

// Oturum hatırla — kayıtlı şifreyi sunucuya doğrulat
(async () => {
  const pw = sessionStorage.getItem(SESSION_KEY);
  if (!pw) return;
  try {
    const res = await fetch(API + '?check=1', { headers: authHeaders() });
    const data = await res.json();
    if (data.ok) showPanel();
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* çevrimdışı — giriş ekranında kal */ }
})();

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const u = $('#username').value.trim();
  const p = $('#password').value;
  const err = $('#login-error');

  if (u !== USERNAME) return showLoginError(err);

  // Şifreyi sunucuda doğrula
  try {
    const res = await fetch(API + '?check=1', { headers: { 'x-admin-password': p } });
    const data = await res.json();
    if (data.ok) {
      sessionStorage.setItem(SESSION_KEY, p);
      showPanel();
    } else {
      showLoginError(err);
    }
  } catch {
    err.textContent = 'Sunucuya ulaşılamadı. Backend kurulu mu?';
    err.hidden = false;
  }
});

function showLoginError(err) {
  err.textContent = 'Kullanıcı adı veya şifre hatalı.';
  err.hidden = false;
  err.style.animation = 'none';
  void err.offsetWidth;
  err.style.animation = 'shake .4s';
}

$('#logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

/* ================= VERİ ================= */
let designs = [];

async function loadDesigns() {
  try {
    const res = await fetch(API, { cache: 'no-store' });
    const data = await res.json();
    designs = Array.isArray(data) ? data : (data.items || []);
  } catch {
    designs = [];
    toast('Tasarımlar yüklenemedi');
  }
  renderList();
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
  // base64, isteğe ~1.33x biner; sunucu limiti için orijinali ~4MB altında tut
  if (file.size > 4 * 1024 * 1024) {
    toast('Dosya 4MB üstü — daha küçük bir görsel öner (kayıt başarısız olabilir).');
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

$('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('#d-title').value.trim();
  const category = $('#d-category').value;
  if (!currentImageData) { toast('Önce bir görsel yükle'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = 'Yükleniyor…';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ title, category, image: currentImageData }),
    });
    if (res.status === 401) { toast('Oturum düştü, tekrar giriş yap'); return; }
    if (!res.ok) throw new Error('kayıt hatası');

    toast('Tasarım eklendi ✓ (yayında)');
    // formu sıfırla
    e.target.reset();
    currentImageData = null;
    previewImg.hidden = true;
    previewImg.src = '';
    dzInner.hidden = false;
    await loadDesigns();
  } catch {
    toast('Eklenemedi — görsel çok büyük olabilir.');
  } finally {
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
});

/* ================= LİSTE ================= */
const CATEGORIES = ['Afiş', 'Logo', 'Banner', 'Gif', 'Diğer'];
let editingId = null;

function renderList() {
  const list = $('#design-list');
  const empty = $('#list-empty');
  $('#count-badge').textContent = designs.length;
  list.innerHTML = '';

  if (designs.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  designs.forEach((d) => {
    const item = document.createElement('div');
    item.className = 'design-item';
    const src = resolveSrc(d.image);
    const isVid = /\.(mp4|webm|mov)$/i.test(d.image) && !d.image.startsWith('data:');
    const media = isVid
      ? `<video src="${src}" muted></video>`
      : `<img src="${src}" alt="" />`;

    if (editingId === d.id) {
      item.innerHTML = `
        ${media}
        <div class="design-edit-form">
          <input type="text" class="edit-title" value="${escapeHtml(d.title || '')}" />
          <select class="edit-category">
            ${CATEGORIES.map(c => `<option ${c === d.category ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="design-edit-actions">
          <button class="design-save" data-id="${d.id}" title="Kaydet">✓</button>
          <button class="design-cancel" title="İptal">✕</button>
        </div>
      `;
    } else {
      item.innerHTML = `
        ${media}
        <div class="design-meta">
          <div class="t">${escapeHtml(d.title || 'İsimsiz')}</div>
          <div class="c">${escapeHtml(d.category || '')}</div>
        </div>
        <button class="design-edit-btn" data-id="${d.id}" title="Düzenle">✎</button>
        <button class="design-del" data-id="${d.id}" title="Sil">🗑</button>
      `;
    }
    list.appendChild(item);
  });
}

$('#design-list').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.design-edit-btn');
  const cancelBtn = e.target.closest('.design-cancel');
  const saveBtn = e.target.closest('.design-save');
  const delBtn = e.target.closest('.design-del');

  if (editBtn) {
    editingId = Number(editBtn.dataset.id);
    renderList();
    return;
  }

  if (cancelBtn) {
    editingId = null;
    renderList();
    return;
  }

  if (saveBtn) {
    const item = saveBtn.closest('.design-item');
    const title = item.querySelector('.edit-title').value.trim();
    const category = item.querySelector('.edit-category').value;
    if (!title) { toast('Başlık boş olamaz'); return; }

    try {
      const res = await fetch(API + '?id=' + encodeURIComponent(saveBtn.dataset.id), {
        method: 'PUT',
        headers: authHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ title, category }),
      });
      if (res.status === 401) { toast('Oturum düştü, tekrar giriş yap'); return; }
      if (!res.ok) throw new Error('güncelleme hatası');
      toast('Güncellendi ✓');
      editingId = null;
      await loadDesigns();
    } catch {
      toast('Güncellenemedi');
    }
    return;
  }

  if (delBtn) {
    if (!confirm('Bu tasarımı silmek istediğine emin misin?')) return;
    try {
      const res = await fetch(API + '?id=' + encodeURIComponent(delBtn.dataset.id), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 401) { toast('Oturum düştü, tekrar giriş yap'); return; }
      if (!res.ok) throw new Error('silme hatası');
      toast('Silindi');
      await loadDesigns();
    } catch {
      toast('Silinemedi');
    }
  }
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
