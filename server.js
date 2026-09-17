// ==================================================
// SANMILITA YUVAK SANGHA - SERVER
// ==================================================

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
const HOST = '0.0.0.0';

// ==================================================
// PATHS
// ==================================================

const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, {
        recursive: true
    });
}

// ==================================================
// DATABASE
// ==================================================

const db = new Database(
    path.join(ROOT, 'database.db')
);

db.pragma('journal_mode = WAL');

// ==================================================
// TABLES
// ==================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        date TEXT DEFAULT '',
        time TEXT DEFAULT '',
        venue TEXT DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT '',
        status TEXT DEFAULT '',
        poster TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        album TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        category TEXT DEFAULT '',
        image TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS team (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        designation TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        photo TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_as TEXT DEFAULT '',
        title_en TEXT DEFAULT '',
        date TEXT DEFAULT '',
        category TEXT DEFAULT '',
        author TEXT DEFAULT '',
        image TEXT DEFAULT '',
        body_as TEXT DEFAULT '',
        body_en TEXT DEFAULT '',
        published INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT DEFAULT '',
        age TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        address TEXT DEFAULT '',
        interests TEXT DEFAULT '',
        skills TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS performances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS performance_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        performance_id INTEGER NOT NULL,
        image TEXT NOT NULL,
        caption TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0
    );
`);

// ==================================================
// ADMIN ACCOUNT
// ==================================================

const adminEmail =
    process.env.ADMIN_EMAIL ||
    'sanmilitayuvaksangha@gmail.com';

const adminPassword =
    process.env.ADMIN_PASSWORD ||
    'vauna717171';

const existingAdmin =
    db.prepare(
        'SELECT id FROM admins WHERE email = ?'
    ).get(adminEmail);

if (!existingAdmin) {

    const hashedPassword =
        bcrypt.hashSync(
            adminPassword,
            10
        );

    db.prepare(`
        INSERT INTO admins
        (email, password)
        VALUES (?, ?)
    `).run(
        adminEmail,
        hashedPassword
    );
}

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
    express.json({
        limit: '10mb'
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '10mb'
    })
);

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
            maxAge:
                1000 * 60 * 60 * 24 * 7
        }
    })
);

// ==================================================
// STATIC FILES
// ==================================================

app.use(
    express.static(ROOT)
);

app.use(
    '/uploads',
    express.static(UPLOAD_DIR)
);

// ==================================================
// MULTER UPLOAD
// ==================================================

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    UPLOAD_DIR
                );
            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const ext =
                    path.extname(
                        file.originalname
                    ).toLowerCase();

                const name =
                    Date.now() +
                    '-' +
                    Math.random()
                        .toString(36)
                        .substring(2, 10) +
                    ext;

                cb(
                    null,
                    name
                );
            }
    });

const upload =
    multer({

        storage,

        limits: {
            fileSize:
                10 * 1024 * 1024
        },

        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const allowed =
                    [
                        '.jpg',
                        '.jpeg',
                        '.png',
                        '.webp',
                        '.gif'
                    ];

                const ext =
                    path.extname(
                        file.originalname
                    ).toLowerCase();

                if (
                    allowed.includes(ext)
                ) {

                    cb(
                        null,
                        true
                    );

                } else {

                    cb(
                        new Error(
                            'Only image files are allowed.'
                        )
                    );
                }
            }
    });

// ==================================================
// AUTH MIDDLEWARE
// ==================================================

function requireAdmin(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.admin
    ) {

        return next();
    }

    return res.status(401).json({
        error: 'Unauthorized'
    });
}

// ==================================================
// HOME
// ==================================================

app.get(
    '/',
    (req, res) => {

        res.sendFile(
            path.join(
                ROOT,
                'index.html'
            )
        );
    }
);

app.get(
    '/admin',
    (req, res) => {

        res.sendFile(
            path.join(
                ROOT,
                'admin.html'
            )
        );
    }
);

// ==================================================
// AUTH API
// ==================================================

app.post(
    '/api/login',
    (req, res) => {

        const {
            email,
            password
        } = req.body;

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                error:
                    'Email and password are required.'
            });
        }

        const admin =
            db.prepare(`
                SELECT *
                FROM admins
                WHERE email = ?
            `).get(email);

        if (!admin) {

            return res.status(401).json({
                error:
                    'Invalid email or password.'
            });
        }

        const valid =
            bcrypt.compareSync(
                password,
                admin.password
            );

        if (!valid) {

            return res.status(401).json({
                error:
                    'Invalid email or password.'
            });
        }

        req.session.admin = {
            id: admin.id,
            email: admin.email
        };

        res.json({
            ok: true,
            email: admin.email
        });
    }
);

app.post(
    '/api/logout',
    (req, res) => {

        req.session.destroy(
            () => {

                res.json({
                    ok: true
                });
            }
        );
    }
);

app.get(
    '/api/me',
    requireAdmin,
    (req, res) => {

        res.json(
            req.session.admin
        );
    }
);

// ==================================================
// CONTENT API
// ==================================================

app.get(
    '/api/content',
    (req, res) => {

        const rows =
            db.prepare(`
                SELECT key, value
                FROM content
            `).all();

        const result = {};

        rows.forEach(row => {

            result[row.key] =
                row.value;

        });

        res.json(result);
    }
);

app.put(
    '/api/content',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        const statement =
            db.prepare(`
                INSERT INTO content
                (key, value)
                VALUES (?, ?)
                ON CONFLICT(key)
                DO UPDATE SET value = excluded.value
            `);

        const transaction =
            db.transaction(() => {

                Object.entries(
                    data
                ).forEach(
                    ([key, value]) => {

                        statement.run(
                            key,
                            String(
                                value ?? ''
                            )
                        );
                    }
                );
            });

        transaction();

        res.json({
            ok: true
        });
    }
);

// ==================================================
// PUBLIC EVENTS
// ==================================================

app.get(
    '/api/events',
    (req, res) => {

        const rows =
            db.prepare(`
                SELECT *
                FROM events
                ORDER BY id DESC
            `).all();

        res.json(rows);
    }
);

// ==================================================
// PUBLIC GALLERY
// ==================================================

app.get(
    '/api/gallery',
    (req, res) => {

        const rows =
            db.prepare(`
                SELECT *
                FROM gallery
                ORDER BY id DESC
            `).all();

        res.json(rows);
    }
);

// ==================================================
// PUBLIC TEAM
// ==================================================

app.get(
    '/api/team',
    (req, res) => {

        const rows =
            db.prepare(`
                SELECT *
                FROM team
                ORDER BY id ASC
            `).all();

        res.json(rows);
    }
);

// ==================================================
// PUBLIC NEWS
// ==================================================

app.get(
    '/api/news',
    (req, res) => {

        const rows =
            db.prepare(`
                SELECT *
                FROM news
                WHERE published = 1
                ORDER BY date DESC, id DESC
            `).all();

        res.json(rows);
    }
);

// ==================================================
// PUBLIC MEMBERSHIP
// ==================================================

app.post(
    '/api/membership',
    (req, res) => {

        const data =
            req.body || {};

        db.prepare(`
            INSERT INTO memberships
            (
                name,
                age,
                phone,
                email,
                address,
                interests,
                skills,
                reason
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.name || '',
            data.age || '',
            data.phone || '',
            data.email || '',
            data.address || '',
            data.interests || '',
            data.skills || '',
            data.reason || ''
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// PUBLIC FEATURED PERFORMANCES
// ==================================================

app.get(
    '/api/performances',
    (req, res) => {

        const performances =
            db.prepare(`
                SELECT *
                FROM performances
                ORDER BY sort_order ASC, id ASC
            `).all();

        const getPhotos =
            db.prepare(`
                SELECT *
                FROM performance_photos
                WHERE performance_id = ?
                ORDER BY sort_order ASC, id ASC
            `);

        const result =
            performances.map(
                performance => {

                    return {
                        ...performance,
                        photos:
                            getPhotos.all(
                                performance.id
                            )
                    };
                }
            );

        res.json(result);
    }
);

// ==================================================
// ADMIN EVENTS
// ==================================================

app.get(
    '/api/admin/events',
    requireAdmin,
    (req, res) => {

        res.json(
            db.prepare(
                'SELECT * FROM events ORDER BY id DESC'
            ).all()
        );
    }
);

app.post(
    '/api/events',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        const result =
            db.prepare(`
                INSERT INTO events
                (
                    name,
                    date,
                    time,
                    venue,
                    description,
                    category,
                    status,
                    poster
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                data.name || '',
                data.date || '',
                data.time || '',
                data.venue || '',
                data.description || '',
                data.category || '',
                data.status || '',
                data.poster || ''
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

app.put(
    '/api/events/:id',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        db.prepare(`
            UPDATE events
            SET
                name = ?,
                date = ?,
                time = ?,
                venue = ?,
                description = ?,
                category = ?,
                status = ?,
                poster = ?
            WHERE id = ?
        `).run(
            data.name || '',
            data.date || '',
            data.time || '',
            data.venue || '',
            data.description || '',
            data.category || '',
            data.status || '',
            data.poster || '',
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

app.delete(
    '/api/events/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(
            'DELETE FROM events WHERE id = ?'
        ).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// ADMIN GALLERY
// ==================================================

app.get(
    '/api/admin/gallery',
    requireAdmin,
    (req, res) => {

        res.json(
            db.prepare(
                'SELECT * FROM gallery ORDER BY id DESC'
            ).all()
        );
    }
);

app.post(
    '/api/gallery',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        const result =
            db.prepare(`
                INSERT INTO gallery
                (
                    album,
                    caption,
                    category,
                    image
                )
                VALUES (?, ?, ?, ?)
            `).run(
                data.album || '',
                data.caption || '',
                data.category || '',
                data.image || ''
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

app.put(
    '/api/gallery/:id',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        db.prepare(`
            UPDATE gallery
            SET
                album = ?,
                caption = ?,
                category = ?,
                image = ?
            WHERE id = ?
        `).run(
            data.album || '',
            data.caption || '',
            data.category || '',
            data.image || '',
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

app.delete(
    '/api/gallery/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(
            'DELETE FROM gallery WHERE id = ?'
        ).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// ADMIN TEAM
// ==================================================

app.get(
    '/api/admin/team',
    requireAdmin,
    (req, res) => {

        res.json(
            db.prepare(
                'SELECT * FROM team ORDER BY id ASC'
            ).all()
        );
    }
);

app.post(
    '/api/team',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        const result =
            db.prepare(`
                INSERT INTO team
                (
                    name,
                    designation,
                    bio,
                    photo
                )
                VALUES (?, ?, ?, ?)
            `).run(
                data.name || '',
                data.designation || '',
                data.bio || '',
                data.photo || ''
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

app.put(
    '/api/team/:id',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        db.prepare(`
            UPDATE team
            SET
                name = ?,
                designation = ?,
                bio = ?,
                photo = ?
            WHERE id = ?
        `).run(
            data.name || '',
            data.designation || '',
            data.bio || '',
            data.photo || '',
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

app.delete(
    '/api/team/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(
            'DELETE FROM team WHERE id = ?'
        ).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// ADMIN NEWS
// ==================================================

app.get(
    '/api/admin/news',
    requireAdmin,
    (req, res) => {

        res.json(
            db.prepare(
                'SELECT * FROM news ORDER BY date DESC, id DESC'
            ).all()
        );
    }
);

app.post(
    '/api/news',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        const result =
            db.prepare(`
                INSERT INTO news
                (
                    title_as,
                    title_en,
                    date,
                    category,
                    author,
                    image,
                    body_as,
                    body_en,
                    published
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                data.title_as || '',
                data.title_en || '',
                data.date || '',
                data.category || '',
                data.author || '',
                data.image || '',
                data.body_as || '',
                data.body_en || '',
                Number(data.published ?? 1)
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

app.put(
    '/api/news/:id',
    requireAdmin,
    (req, res) => {

        const data =
            req.body || {};

        db.prepare(`
            UPDATE news
            SET
                title_as = ?,
                title_en = ?,
                date = ?,
                category = ?,
                author = ?,
                image = ?,
                body_as = ?,
                body_en = ?,
                published = ?
            WHERE id = ?
        `).run(
            data.title_as || '',
            data.title_en || '',
            data.date || '',
            data.category || '',
            data.author || '',
            data.image || '',
            data.body_as || '',
            data.body_en || '',
            Number(data.published ?? 1),
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

app.delete(
    '/api/news/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(
            'DELETE FROM news WHERE id = ?'
        ).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// ADMIN MEMBERSHIPS
// ==================================================

app.get(
    '/api/admin/memberships',
    requireAdmin,
    (req, res) => {

        res.json(
            db.prepare(`
                SELECT *
                FROM memberships
                ORDER BY id DESC
            `).all()
        );
    }
);

app.delete(
    '/api/memberships/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(
            'DELETE FROM memberships WHERE id = ?'
        ).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// FEATURED PERFORMANCES - ADMIN
// IMPORTANT: THESE ROUTES COME BEFORE ANY GENERIC
// ADMIN TYPE ROUTES.
// ==================================================

app.get(
    '/api/admin/performances',
    requireAdmin,
    (req, res) => {

        const performances =
            db.prepare(`
                SELECT *
                FROM performances
                ORDER BY sort_order ASC, id ASC
            `).all();

        const getPhotos =
            db.prepare(`
                SELECT *
                FROM performance_photos
                WHERE performance_id = ?
                ORDER BY sort_order ASC, id ASC
            `);

        const result =
            performances.map(
                performance => {

                    return {
                        ...performance,
                        photos:
                            getPhotos.all(
                                performance.id
                            )
                    };
                }
            );

        res.json(result);
    }
);

// ADD PERFORMANCE

app.post(
    '/api/admin/performances',
    requireAdmin,
    (req, res) => {

        const {
            title,
            description,
            sort_order
        } = req.body || {};

        if (!title || !title.trim()) {

            return res.status(400).json({
                error:
                    'Performance title is required.'
            });
        }

        const result =
            db.prepare(`
                INSERT INTO performances
                (
                    title,
                    description,
                    sort_order
                )
                VALUES (?, ?, ?)
            `).run(
                title.trim(),
                description || '',
                Number(
                    sort_order || 0
                )
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

// EDIT PERFORMANCE

app.put(
    '/api/admin/performances/:id',
    requireAdmin,
    (req, res) => {

        const {
            title,
            description,
            sort_order
        } = req.body || {};

        if (!title || !title.trim()) {

            return res.status(400).json({
                error:
                    'Performance title is required.'
            });
        }

        const result =
            db.prepare(`
                UPDATE performances
                SET
                    title = ?,
                    description = ?,
                    sort_order = ?
                WHERE id = ?
            `).run(
                title.trim(),
                description || '',
                Number(
                    sort_order || 0
                ),
                req.params.id
            );

        if (result.changes === 0) {

            return res.status(404).json({
                error:
                    'Performance not found.'
            });
        }

        res.json({
            ok: true
        });
    }
);

// DELETE PERFORMANCE

app.delete(
    '/api/admin/performances/:id',
    requireAdmin,
    (req, res) => {

        const performanceId =
            req.params.id;

        const transaction =
            db.transaction(() => {

                db.prepare(`
                    DELETE FROM performance_photos
                    WHERE performance_id = ?
                `).run(
                    performanceId
                );

                db.prepare(`
                    DELETE FROM performances
                    WHERE id = ?
                `).run(
                    performanceId
                );
            });

        transaction();

        res.json({
            ok: true
        });
    }
);

// ADD PHOTOS TO PERFORMANCE

app.post(
    '/api/admin/performances/:id/photos',
    requireAdmin,
    (req, res) => {

        const {
            image,
            caption,
            sort_order
        } = req.body || {};

        if (!image) {

            return res.status(400).json({
                error:
                    'Image is required.'
            });
        }

        const performance =
            db.prepare(`
                SELECT id
                FROM performances
                WHERE id = ?
            `).get(
                req.params.id
            );

        if (!performance) {

            return res.status(404).json({
                error:
                    'Performance not found.'
            });
        }

        const result =
            db.prepare(`
                INSERT INTO performance_photos
                (
                    performance_id,
                    image,
                    caption,
                    sort_order
                )
                VALUES (?, ?, ?, ?)
            `).run(
                req.params.id,
                image,
                caption || '',
                Number(
                    sort_order || 0
                )
            );

        res.json({
            ok: true,
            id: result.lastInsertRowid
        });
    }
);

// EDIT PERFORMANCE PHOTO

app.put(
    '/api/admin/performance-photos/:id',
    requireAdmin,
    (req, res) => {

        const {
            image,
            caption,
            sort_order
        } = req.body || {};

        db.prepare(`
            UPDATE performance_photos
            SET
                image = ?,
                caption = ?,
                sort_order = ?
            WHERE id = ?
        `).run(
            image || '',
            caption || '',
            Number(
                sort_order || 0
            ),
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// DELETE PERFORMANCE PHOTO

app.delete(
    '/api/admin/performance-photos/:id',
    requireAdmin,
    (req, res) => {

        db.prepare(`
            DELETE FROM performance_photos
            WHERE id = ?
        `).run(
            req.params.id
        );

        res.json({
            ok: true
        });
    }
);

// ==================================================
// IMAGE UPLOAD
// ==================================================

app.post(
    '/api/upload',
    requireAdmin,
    upload.single('image'),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({
                error:
                    'No image uploaded.'
            });
        }

        const imageUrl =
            `/uploads/${req.file.filename}`;

        res.json({
            ok: true,
            url: imageUrl,
            filename:
                req.file.filename
        });
    }
);

// ==================================================
// ERROR HANDLER
// ==================================================

app.use(
    (error, req, res, next) => {

        console.error(
            error
        );

        res.status(500).json({
            error:
                error.message ||
                'Server error'
        });
    }
);

// ==================================================
// START SERVER
// ==================================================

app.listen(
    PORT,
    HOST,
    () => {

        console.log(
            `Sanmilita Yuvak Sangha server running on ${HOST}:${PORT}`
        );

    }
);
