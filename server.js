require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Data directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Create directories BEFORE opening SQLite database
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// SQLite database
const db = new Database(path.join(DATA_DIR, 'site.db'));

// Create database tables
db.exec(`
CREATE TABLE IF NOT EXISTS admins(
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS content(
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  date TEXT,
  time TEXT,
  venue TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  poster TEXT
);

CREATE TABLE IF NOT EXISTS gallery(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album TEXT,
  caption TEXT,
  category TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS team(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  designation TEXT,
  bio TEXT,
  photo TEXT
);

CREATE TABLE IF NOT EXISTS news(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_as TEXT,
  title_en TEXT,
  date TEXT,
  category TEXT,
  author TEXT,
  image TEXT,
  body_as TEXT,
  body_en TEXT,
  published INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS memberships(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT,
  age TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  interest TEXT,
  skills TEXT,
  why TEXT,
  status TEXT DEFAULT 'New',
  created_at TEXT
);
`);

// Admin credentials
const adminEmail =
  process.env.ADMIN_EMAIL || 'sanmilitayuvaksangha@gmail.com';

const adminPass =
  process.env.ADMIN_PASSWORD || 'vauna717171';

if (adminPass) {
  const existing = db
    .prepare('SELECT id FROM admins WHERE email=?')
    .get(adminEmail);

  if (!existing) {
    db.prepare(
      'INSERT INTO admins(email,password_hash) VALUES(?,?)'
    ).run(
      adminEmail,
      bcrypt.hashSync(adminPass, 12)
    );
  }
}

// Default website content
const defaults = {
  hero_as: 'সন্মিলিত যুৱক সংঘ, তেজপুৰ',

  hero_en: 'Sanmilita Yuvak Sangha, Tezpur',

  hero_sub:
    'দুজনা গুৰুৰ সৃষ্টি জীয়াই ৰখা আমাৰ এটি প্ৰচেষ্টা। ২০২৩ চনৰ পৰা আজিলৈকে এই সংকল্পক হৃদয়ত ধাৰণ কৰি আমি একেলগে আগবাঢ়ি আহিছোঁ।',

  identity:
    'অসমীয়া সংস্কৃতি জীয়াই ৰখা আমাৰ প্ৰধান উদ্দেশ্য। ২০২৩ চনৰ পৰা আজিলৈকে এই সংকল্পক হৃদয়ত ধাৰণ কৰি আমি একেলগে আগবাঢ়ি আহিছোঁ।',

  about_start:
    '২০২৩ চনত আৰম্ভ হোৱা আমাৰ যাত্ৰাৰ কেন্দ্ৰবিন্দু হৈছে সংস্কৃতি, যুৱ অংশগ্ৰহণ আৰু সামাজিক একতা।',

  about_mission:
    'ভাওঁনা, দিহানাম, সত্ৰীয়া আৰু অসমৰ ঐতিহ্যবাহী শিল্পকলাৰ প্ৰচাৰ-প্ৰসাৰ আৰু নতুন প্ৰজন্মৰ মাজত আগবঢ়াই নিয়া।',

  about_vision:
    'সংস্কৃতিৰ শিপা অটুট ৰাখি যুৱ শক্তিক একত্ৰিত কৰা এক সক্ৰিয়, দায়বদ্ধ আৰু সৃষ্টিশীল মঞ্চ।',

  contact_address:
    'B.P TINIALI,TEZPUR,ASSAM',

  contact_phone:
    '9394908170,6001291820',

  contact_email:
    'sanmilitayuvaksangha@gmail.com',

  facebook: '',

  instagram: '',

  youtube: '',

  whatsapp:
    '919394908170'
};

// Insert default content
for (const [key, value] of Object.entries(defaults)) {
  db.prepare(
    'INSERT OR IGNORE INTO content(key,value) VALUES(?,?)'
  ).run(key, value);
}

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'CHANGE_THIS_SECRET',

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 8 * 60 * 60 * 1000
    }
  })
);

// Static files
app.use(
  '/uploads',
  express.static(UPLOADS_DIR)
);

app.use(
  express.static(path.join(__dirname, 'public'))
);

// Authentication
function auth(req, res, next) {
  if (req.session.admin) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized'
  });
}

// File upload
const upload = multer({
  dest: UPLOADS_DIR
});

// ===============================
// PUBLIC API
// ===============================

app.get('/api/content', (req, res) => {
  const rows = db
    .prepare('SELECT key,value FROM content')
    .all();

  res.json(
    Object.fromEntries(
      rows.map(row => [row.key, row.value])
    )
  );
});

app.post('/api/membership', (req, res) => {
  const r = req.body;

  db.prepare(`
    INSERT INTO memberships(
      full_name,
      age,
      phone,
      email,
      address,
      interest,
      skills,
      why,
      created_at
    )
    VALUES(
      ?,?,?,?,?,?,?,?,datetime('now')
    )
  `).run(
    r.full_name,
    r.age,
    r.phone,
    r.email,
    r.address,
    r.interest,
    r.skills,
    r.why
  );

  res.json({
    ok: true
  });
});

app.get('/api/events', (req, res) => {
  res.json(
    db.prepare(
      'SELECT * FROM events ORDER BY date'
    ).all()
  );
});

app.get('/api/gallery', (req, res) => {
  res.json(
    db.prepare(
      'SELECT * FROM gallery ORDER BY id DESC'
    ).all()
  );
});

app.get('/api/team', (req, res) => {
  res.json(
    db.prepare(
      'SELECT * FROM team ORDER BY id'
    ).all()
  );
});

app.get('/api/news', (req, res) => {
  res.json(
    db.prepare(
      'SELECT * FROM news WHERE published=1 ORDER BY date DESC'
    ).all()
  );
});

// ===============================
// LOGIN
// ===============================

app.post('/api/login', (req, res) => {
  const a = db
    .prepare(
      'SELECT * FROM admins WHERE email=?'
    )
    .get(req.body.email);

  if (
    a &&
    bcrypt.compareSync(
      req.body.password,
      a.password_hash
    )
  ) {
    req.session.admin = {
      id: a.id,
      email: a.email
    };

    return res.json({
      ok: true
    });
  }

  res.status(401).json({
    error: 'Invalid credentials'
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true
    });
  });
});

app.get('/api/me', auth, (req, res) => {
  res.json(req.session.admin);
});

// ===============================
// ADMIN API
// ===============================

app.get('/api/admin/:type', auth, (req, res) => {
  const allowed = {
    events: 'events',
    gallery: 'gallery',
    team: 'team',
    news: 'news',
    memberships: 'memberships'
  };

  const t = allowed[req.params.type];

  if (!t) {
    return res.status(400).json({
      error: 'Invalid type'
    });
  }

  res.json(
    db.prepare(
      `SELECT * FROM ${t} ORDER BY id DESC`
    ).all()
  );
});

// Update website content
app.put('/api/content', auth, (req, res) => {
  const stmt = db.prepare(`
    INSERT INTO content(key,value)
    VALUES(?,?)
    ON CONFLICT(key)
    DO UPDATE SET value=excluded.value
  `);

  const tx = db.transaction(data => {
    Object.entries(data).forEach(
      ([key, value]) => {
        stmt.run(key, String(value));
      }
    );
  });

  tx(req.body);

  res.json({
    ok: true
  });
});

// Upload image
app.post(
  '/api/upload',
  auth,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file'
      });
    }

    res.json({
      url: '/uploads/' + req.file.filename
    });
  }
);

// Add admin content
app.post('/api/:type', auth, (req, res) => {
  const t = req.params.type;

  const maps = {
    events: [
      'name',
      'date',
      'time',
      'venue',
      'description',
      'category',
      'status',
      'poster'
    ],

    gallery: [
      'album',
      'caption',
      'category',
      'image'
    ],

    team: [
      'name',
      'designation',
      'bio',
      'photo'
    ],

    news: [
      'title_as',
      'title_en',
      'date',
      'category',
      'author',
      'image',
      'body_as',
      'body_en',
      'published'
    ]
  };

  if (!maps[t]) {
    return res.status(400).json({
      error: 'Invalid type'
    });
  }

  const fields = maps[t];

  const sql = `
    INSERT INTO ${t}(${fields.join(',')})
    VALUES(${fields.map(() => '?').join(',')})
  `;

  const values = fields.map(
    key => req.body[key] ?? ''
  );

  const info = db
    .prepare(sql)
    .run(...values);

  res.json({
    id: info.lastInsertRowid
  });
});

// Update admin content
app.put('/api/:type/:id', auth, (req, res) => {
  const t = req.params.type;

  const maps = {
    events: [
      'name',
      'date',
      'time',
      'venue',
      'description',
      'category',
      'status',
      'poster'
    ],

    gallery: [
      'album',
      'caption',
      'category',
      'image'
    ],

    team: [
      'name',
      'designation',
      'bio',
      'photo'
    ],

    news: [
      'title_as',
      'title_en',
      'date',
      'category',
      'author',
      'image',
      'body_as',
      'body_en',
      'published'
    ]
  };

  if (!maps[t]) {
    return res.status(400).json({
      error: 'Invalid type'
    });
  }

  const fields = maps[t];

  const sql = `
    UPDATE ${t}
    SET ${fields.map(key => key + '=?').join(',')}
    WHERE id=?
  `;

  db.prepare(sql).run(
    ...fields.map(
      key => req.body[key] ?? ''
    ),
    req.params.id
  );

  res.json({
    ok: true
  });
});

// Delete admin content
app.delete('/api/:type/:id', auth, (req, res) => {
  const allowed = [
    'events',
    'gallery',
    'team',
    'news',
    'memberships'
  ];

  if (!allowed.includes(req.params.type)) {
    return res.status(400).json({
      error: 'Invalid type'
    });
  }

  db.prepare(
    `DELETE FROM ${req.params.type} WHERE id=?`
  ).run(req.params.id);

  res.json({
    ok: true
  });
});

// ===============================
// START SERVER
// ===============================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Running on 0.0.0.0:${PORT}`
    );
  }
);
