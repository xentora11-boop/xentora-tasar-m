// Xentora Design — Tasarim API'si (Turso / libSQL)
// GET    /api/designs           -> tum tasarimlari listeler (herkese acik)
// GET    /api/designs?check=1   -> admin sifresini dogrular (header ile)
// POST   /api/designs           -> yeni tasarim ekler (admin sifresi gerekir)
// PUT    /api/designs?id=123    -> baslik/kategori gunceller (admin sifresi gerekir)
// DELETE /api/designs?id=123    -> tasarim siler (admin sifresi gerekir)

import { createClient } from "@libsql/client";

export const config = { path: "/api/designs" };

let db;
let ready;

function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

// Repodaki mevcut ornek tasarimlar — DB ilk kez olusturulunca yuklenir
const SEED = [
  { title: "Xentora Banner 2026", category: "Banner", image: "images/uploads/banner-2026.png" },
  { title: "Item Satis Afisi", category: "Afis", image: "images/uploads/item-banner.png" },
  { title: "Xentora Logo Tasarimi", category: "Logo", image: "images/uploads/xentora-logo.png" },
  { title: "Hediye Animasyonu", category: "Gif", image: "images/uploads/gift-animasyon.gif" },
];

// Tablo + tek seferlik seed
function ensureTable() {
  if (!ready) {
    const db = getDb();
    ready = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS designs (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          title      TEXT NOT NULL,
          category   TEXT NOT NULL DEFAULT 'Diger',
          image      TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await db.execute(`CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`);
      // Sadece bir kez tohumla (silinmis kayitlari geri getirmesin)
      const seeded = await db.execute("SELECT v FROM meta WHERE k = 'seeded'");
      if (seeded.rows.length === 0) {
        for (const s of SEED) {
          await db.execute({
            sql: "INSERT INTO designs (title, category, image) VALUES (?, ?, ?)",
            args: [s.title, s.category, s.image],
          });
        }
        await db.execute("INSERT INTO meta (k, v) VALUES ('seeded', '1')");
      }
    })();
  }
  return ready;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Yazma islemleri icin sifre kontrolu
function isAuthed(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // sifre tanimli degilse yazmaya izin yok
  const given = req.headers.get("x-admin-password");
  return given === expected;
}

export default async (req) => {
  try {
    await ensureTable();
    const db = getDb();
    const url = new URL(req.url);

    // --- Sifre dogrulama ---
    if (req.method === "GET" && url.searchParams.get("check") === "1") {
      return json({ ok: isAuthed(req) });
    }

    // --- Listele (acik) ---
    if (req.method === "GET") {
      const res = await db.execute(
        "SELECT id, title, category, image, created_at FROM designs ORDER BY id DESC"
      );
      const items = res.rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        image: r.image,
        date: String(r.created_at || "").slice(0, 10),
      }));
      return json({ items });
    }

    // --- Ekle (korumali) ---
    if (req.method === "POST") {
      if (!isAuthed(req)) return json({ error: "Yetkisiz" }, 401);
      const body = await req.json().catch(() => ({}));
      const title = String(body.title || "").trim();
      const category = String(body.category || "Diger").trim();
      const image = String(body.image || "");
      if (!title || !image) return json({ error: "Baslik ve gorsel zorunlu" }, 400);

      const res = await db.execute({
        sql: "INSERT INTO designs (title, category, image) VALUES (?, ?, ?)",
        args: [title, category, image],
      });
      return json({ ok: true, id: Number(res.lastInsertRowid) }, 201);
    }

    // --- Guncelle (korumali) ---
    if (req.method === "PUT") {
      if (!isAuthed(req)) return json({ error: "Yetkisiz" }, 401);
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id gerekli" }, 400);
      const body = await req.json().catch(() => ({}));
      const title = String(body.title || "").trim();
      const category = String(body.category || "Diger").trim();
      if (!title) return json({ error: "Baslik zorunlu" }, 400);

      await db.execute({
        sql: "UPDATE designs SET title = ?, category = ? WHERE id = ?",
        args: [title, category, id],
      });
      return json({ ok: true });
    }

    // --- Sil (korumali) ---
    if (req.method === "DELETE") {
      if (!isAuthed(req)) return json({ error: "Yetkisiz" }, 401);
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id gerekli" }, 400);
      await db.execute({ sql: "DELETE FROM designs WHERE id = ?", args: [id] });
      return json({ ok: true });
    }

    return json({ error: "Desteklenmeyen istek" }, 405);
  } catch (err) {
    return json({ error: "Sunucu hatasi", detail: String(err && err.message || err) }, 500);
  }
};
