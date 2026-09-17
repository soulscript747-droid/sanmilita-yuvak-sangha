require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// DIRECTORIES
// --------------------------------------------------

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --------------------------------------------------
// DATABASE
// --------------------------------------------------

const db = new Database(path.join(DATA_DIR, 'site.db'));

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

// --------------------------------------------------
// ADMIN ACCOUNT
// --------------------------------------------------

const adminEmail =
    process.env.ADMIN_EMAIL || 'sanmilitayuvaksangha@gmail.com';

const adminPass =
    process.env.ADMIN_PASSWORD || 'vauna717171';

const existingAdmin = db
    .prepare('SELECT id FROM admins WHERE email = ?')
    .get(adminEmail);

if (!existingAdmin && adminPass) {
    const hash = bcrypt.hashSync(adminPass, 12);

    db.prepare(`
        INSERT INTO admins(email, password_hash)
        VALUES(?, ?)
    `).run(adminEmail, hash);
}

// --------------------------------------------------
// DEFAULT WEBSITE CONTENT
// --------------------------------------------------

const defaults = {
    hero_as: 'সন্মিলিত যুৱক সংঘ, তেজপুৰ',

    hero_en: 'Sanmilita Yuvak Sangha, Tezpur',

    hero_sub:
        'দুজনা গুৰুৰ সৃষ্টি জীয়াই ৰখা আমাৰ এটি প্ৰচেষ্টা। ২০২৩ চনৰ পৰা আজিলৈকে এই সংকল্পক হৃদয়ত ধাৰণ কৰি আমি একেলগে আগবাঢ়ি আহিছোঁ।',

    identity:
        'অসমীয়া সংস্কৃতি জীয়াই ৰখা আমাৰ প্ৰধান উদ্দেশ্য। ২০২৩ চনৰ পৰা আজিলৈকে এই সংকল্পক হৃদয়ত ধাৰণ কৰি আমি একেলগে আগবাঢ়ি আহিছোঁ।',

    about_start:
        '২০২৩ চনত ১০–১৫ জন যুৱক একত্ৰিত হৈ এক আলোচনাত মিলিত হৈছিলোঁ—তেজপুৰ তথা অসমৰ চহকী সংস্কৃতি আৰু দুজনা গুৰুৰ অমূল্য সৃষ্টিক কেনেদৰে জীয়াই ৰাখি আগন্তুক প্ৰজন্মৰ মাজলৈ লৈ যাব পাৰি। সেই চিন্তা আৰু সংকল্পৰ পৰাই আমি একত্ৰিতভাৱে এখন ভাওঁনা অনুষ্ঠিত কৰাৰ সিদ্ধান্ত গ্ৰহণ কৰোঁ।',

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

    facebook:
        '',

    instagram:
        '',

    youtube:
        '',

    whatsapp:
        '919394908170'
};

for (const [key, value] of Object.entries(defaults)) {
    db.prepare(`
        INSERT OR IGNORE INTO content(key, value)
        VALUES(?, ?)
    `).run(key, value);
}

// --------------------------------------------------
// EXPRESS CONFIGURATION
// --------------------------------------------------

app.use(express.json({ limit: '2mb' }));

app.use(
    express.urlencoded({
        extended: true
    })
);

// --------------------------------------------------
// SESSION
// --------------------------------------------------

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

// --------------------------------------------------
// STATIC FILES
// --------------------------------------------------

// Your index.html, styles.css, app.js,
// hero.jpg and logo.jpg are in the repository root.

app.use(
    express.static(__dirname, {
        index: false
    })
);

// Uploaded images
app.use(
    '/uploads',
    express.static(UPLOAD_DIR)
);

// --------------------------------------------------
// HOME PAGE
// --------------------------------------------------

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

function auth(req, res, next) {
    if (req.session.admin) {
        return next();
    }

    res.status(401).json({
        error: 'Unauthorized'
    });
}

// --------------------------------------------------
// FILE UPLOAD
// --------------------------------------------------

const upload = multer({
    dest: UPLOAD_DIR
});

// --------------------------------------------------
// PUBLIC API
// --------------------------------------------------

app.get('/api/content', (req, res) => {
    const rows = db
        .prepare('SELECT key, value FROM content')
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
            ?, ?, ?, ?, ?, ?, ?, ?,
            datetime('now')
        )
    `).run(
        r.full_name || '',
        r.age || '',
        r.phone || '',
        r.email || '',
        r.address || '',
        r.interest || '',
        r.skills || '',
        r.why || ''
    );

    res.json({
        ok: true
    });
});

app.get('/api/events', (req, res) => {
    const events = db
        .prepare(`
            SELECT *
            FROM events
            ORDER BY date
        `)
        .all();

    res.json(events);
});

app.get('/api/gallery', (req, res) => {
    const gallery = db
        .prepare(`
            SELECT *
            FROM gallery
            ORDER BY id DESC
        `)
        .all();

    res.json(gallery);
});

app.get('/api/team', (req, res) => {
    const team = db
        .prepare(`
            SELECT *
            FROM team
            ORDER BY id
        `)
        .all();

    res.json(team);
});

app.get('/api/news', (req, res) => {
    const news = db
        .prepare(`
            SELECT *
            FROM news
            WHERE published = 1
            ORDER BY date DESC
        `)
        .all();

    res.json(news);
});

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post('/api/login', (req, res) => {
    const email = req.body.email || '';
    const password = req.body.password || '';

    const admin = db
        .prepare(`
            SELECT *
            FROM admins
            WHERE email = ?
        `)
        .get(email);

    if (
        admin &&
        bcrypt.compareSync(
            password,
            admin.password_hash
        )
    ) {
        req.session.admin = {
            id: admin.id,
            email: admin.email
        };

        return res.json({
            ok: true
        });
    }

    res.status(401).json({
        error: 'Invalid credentials'
    });
});

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({
            ok: true
        });
    });
});

// --------------------------------------------------
// CURRENT ADMIN
// --------------------------------------------------

app.get('/api/me', auth, (req, res) => {
    res.json(req.session.admin);
});

// --------------------------------------------------
// ADMIN DATA
// --------------------------------------------------

app.get('/api/admin/:type', auth, (req, res) => {
    const allowed = {
        events: 'events',
        gallery: 'gallery',
        team: 'team',
        news: 'news',
        memberships: 'memberships'
    };

    const table = allowed[req.params.type];

    if (!table) {
        return res.status(400).json({
            error: 'Invalid type'
        });
    }

    const rows = db
        .prepare(`
            SELECT *
            FROM ${table}
            ORDER BY id DESC
        `)
        .all();

    res.json(rows);
});

// --------------------------------------------------
// UPDATE WEBSITE CONTENT
// --------------------------------------------------

app.put('/api/content', auth, (req, res) => {
    const statement = db.prepare(`
        INSERT INTO content(key, value)
        VALUES(?, ?)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
    `);

    const transaction = db.transaction(data => {
        for (const [key, value] of Object.entries(data)) {
            statement.run(key, String(value));
        }
    });

    transaction(req.body);

    res.json({
        ok: true
    });
});

// --------------------------------------------------
// IMAGE UPLOAD
// --------------------------------------------------

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

// --------------------------------------------------
// ADD DATA
// --------------------------------------------------

app.post('/api/:type', auth, (req, res) => {

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

    const type = req.params.type;
    const fields = maps[type];

    if (!fields) {
        return res.status(400).json({
            error: 'Invalid type'
        });
    }

    const placeholders = fields
        .map(() => '?')
        .join(',');

    const sql = `
        INSERT INTO ${type}
        (${fields.join(',')})
        VALUES(${placeholders})
    `;

    const values = fields.map(
        field => req.body[field] ?? ''
    );

    const result = db
        .prepare(sql)
        .run(...values);

    res.json({
        id: result.lastInsertRowid
    });
});

// --------------------------------------------------
// UPDATE DATA
// --------------------------------------------------

app.put('/api/:type/:id', auth, (req, res) => {

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

    const type = req.params.type;
    const fields = maps[type];

    if (!fields) {
        return res.status(400).json({
            error: 'Invalid type'
        });
    }

    const setters = fields
        .map(field => `${field} = ?`)
        .join(',');

    const sql = `
        UPDATE ${type}
        SET ${setters}
        WHERE id = ?
    `;

    const values = fields.map(
        field => req.body[field] ?? ''
    );

    values.push(req.params.id);

    db.prepare(sql).run(...values);

    res.json({
        ok: true
    });
});

// --------------------------------------------------
// DELETE DATA
// --------------------------------------------------

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

    db.prepare(`
        DELETE FROM ${req.params.type}
        WHERE id = ?
    `).run(req.params.id);

    res.json({
        ok: true
    });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, '0.0.0.0', () => {
    console.log(
        `Sanmilita Yuvak Sangha server running on port ${PORT}`
    );
});
