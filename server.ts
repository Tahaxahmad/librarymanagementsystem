import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { EXTRA_BOOKS } from './seed-books';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database('library.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('student', 'librarian')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    total_copies INTEGER NOT NULL,
    available_copies INTEGER NOT NULL,
    genre TEXT,
    publication_year INTEGER,
    author_nationality TEXT,
    kids_friendly INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS borrowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    borrow_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT CHECK(status IN ('borrowed', 'returned')) NOT NULL DEFAULT 'borrowed',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reservation_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'fulfilled', 'cancelled')) NOT NULL DEFAULT 'active',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try {
  db.exec('ALTER TABLE books ADD COLUMN kids_friendly INTEGER NOT NULL DEFAULT 0');
} catch {
}

const seedUsers = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (seedUsers.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)');
  insertUser.run('Alice Librarian', 'alice@library.edu', 'librarian');
  insertUser.run('Bob Student', 'bob@student.edu', 'student');
  insertUser.run('Charlie Student', 'charlie@student.edu', 'student');

  const insertBook = db.prepare(
    'INSERT INTO books (title, author, isbn, total_copies, available_copies, genre, publication_year, author_nationality, kids_friendly) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  insertBook.run('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 5, 5, 'Fiction', 1925, 'American', 0);
  insertBook.run('To Kill a Mockingbird', 'Harper Lee', '9780060935467', 3, 3, 'Fiction', 1960, 'American', 1);
  insertBook.run('1984', 'George Orwell', '9780451524935', 4, 4, 'Science Fiction', 1949, 'British', 0);
  insertBook.run('Pride and Prejudice', 'Jane Austen', '9780141439518', 2, 2, 'Romance', 1813, 'British', 0);
}

const insExtra = db.prepare(
  'INSERT OR IGNORE INTO books (title, author, isbn, total_copies, available_copies, genre, publication_year, author_nationality, kids_friendly) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
const txExtra = db.transaction(() => {
  for (const b of EXTRA_BOOKS) {
    insExtra.run(
      b.title,
      b.author,
      b.isbn,
      b.total_copies,
      b.total_copies,
      b.genre,
      b.publication_year,
      b.author_nationality,
      b.kids_friendly,
    );
  }
});
txExtra();

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    blurb TEXT,
    is_approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(book_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS reading_dna (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    genre_breakdown TEXT,
    books_total INTEGER,
    avg_per_month REAL,
    taste_label TEXT,
    last_calculated TEXT
  );
`);
for (const [table, col, def] of [
  ['books', 'is_staff_pick', 'INTEGER NOT NULL DEFAULT 0'],
  ['books', 'staff_pick_note', 'TEXT'],
] as const) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  } catch {
  }
}

try {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
} catch {
}

for (const col of ['renew_count', 'renew_extra_allowed'] as const) {
  try {
    db.exec(`ALTER TABLE borrowings ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0`);
  } catch {
  }
}

const reviewCount = (db.prepare('SELECT count(*) as n FROM reviews').get() as { n: number }).n;
const staffPickCount = (db.prepare('SELECT count(*) as n FROM books WHERE is_staff_pick = 1').get() as { n: number }).n;
if (staffPickCount < 5) {
  const need = 5 - staffPickCount;
  const picks = db
    .prepare('SELECT id FROM books WHERE COALESCE(is_staff_pick, 0) = 0 ORDER BY id LIMIT ?')
    .all(need) as { id: number }[];
  const notes = [
    'Hand-picked by our team for curious readers.',
    'A librarian favourite — start here.',
    'Perfect for book clubs and solo reading alike.',
    'Widely cited and endlessly discussable.',
    'Recently added to our spotlight shelf.',
  ];
  picks.forEach((row, idx) => {
    db.prepare('UPDATE books SET is_staff_pick = 1, staff_pick_note = ? WHERE id = ?').run(notes[idx % notes.length], row.id);
  });
}

if (reviewCount === 0) {
  const insRev = db.prepare(
    'INSERT INTO reviews (book_id, user_id, rating, blurb, is_approved) VALUES (?, ?, ?, ?, 1)',
  );
  const bob = db.prepare("SELECT id FROM users WHERE email = 'bob@student.edu'").get() as { id: number } | undefined;
  const booksSample = db.prepare('SELECT id FROM books ORDER BY id LIMIT 5').all() as { id: number }[];
  if (bob && booksSample.length >= 3) {
    insRev.run(booksSample[0].id, bob.id, 5, 'A stunning read — could not put it down.');
    insRev.run(booksSample[1].id, bob.id, 4, 'Thoughtful pacing and memorable characters throughout.');
    const charlie = db.prepare("SELECT id FROM users WHERE email = 'charlie@student.edu'").get() as { id: number } | undefined;
    if (charlie) {
      insRev.run(booksSample[2].id, charlie.id, 5, 'Perfect for late-night reading — lyrical and immersive.');
    }
  }
}

function parseIntParam(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function genrePages(genre: string | null | undefined): number {
  const g = (genre || '').toLowerCase();
  if (g.includes('science') || g.includes('sci-fi')) return 380;
  if (g.includes('fiction')) return 320;
  if (g.includes('academic') || g.includes('textbook')) return 450;
  if (g.includes('non-fiction') || g.includes('biography')) return 340;
  return 300;
}

function tasteFromGenres(top: [string, number][]): string {
  const [a, b] = top;
  if (!a) return 'The Curious Reader';
  const ga = a[0].toLowerCase();
  const gb = b?.[0]?.toLowerCase() || '';
  if (ga.includes('sci') || gb.includes('sci')) return 'The Curious Explorer';
  if (ga.includes('romance') || gb.includes('romance')) return 'The Classic Romantic';
  if (ga.includes('non') || ga.includes('academic')) return 'The Deep Thinker';
  if (ga.includes('fiction')) return 'The Story Seeker';
  return 'The Curious Explorer';
}

function computeReadingDna(userId: number) {
  const rows = db
    .prepare(
      `
    SELECT bk.genre,
      SUM(CASE WHEN br.status = 'returned' THEN 1.0 ELSE 0.5 END) as cnt,
      SUM(CASE WHEN br.status = 'returned' THEN 1 ELSE 0 END) as finished_part,
      SUM(CASE WHEN br.status = 'borrowed' THEN 1 ELSE 0 END) as reading_part
    FROM borrowings br
    JOIN books bk ON br.book_id = bk.id
    WHERE br.user_id = ? AND br.status IN ('borrowed', 'returned')
    GROUP BY bk.genre
  `,
    )
    .all(userId) as { genre: string | null; cnt: number; finished_part: number; reading_part: number }[];

  const genre_breakdown: Record<string, number> = {};
  let books_total = 0;
  let books_reading_now = 0;
  let totalPages = 0;
  for (const r of rows) {
    const label = r.genre || 'Unknown';
    genre_breakdown[label] = Math.round(r.cnt * 10) / 10;
    books_total += r.finished_part;
    books_reading_now += r.reading_part;
    totalPages +=
      r.finished_part * genrePages(r.genre) + r.reading_part * genrePages(r.genre) * 0.5;
  }

  const firstBorrow = db
    .prepare(
      `
    SELECT MIN(borrow_date) as d FROM borrowings WHERE user_id = ? AND status IN ('borrowed', 'returned')
  `,
    )
    .get(userId) as { d: string | null } | undefined;
  const months = Math.max(
    1,
    (() => {
      if (!firstBorrow?.d) return 1;
      const a = new Date(firstBorrow.d).getTime();
      const b = Date.now();
      return Math.ceil((b - a) / (30.44 * 24 * 60 * 60 * 1000));
    })(),
  );
  const avg_per_month = books_total / months;

  const sorted = Object.entries(genre_breakdown).sort((x, y) => y[1] - x[1]);
  const taste_label = tasteFromGenres(sorted as [string, number][]);

  let streak = 0;
  let weekEnd = new Date();
  for (let i = 0; i < 104; i++) {
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    const anyBorrow = db
      .prepare(
        `
      SELECT 1 FROM borrowings
      WHERE user_id = ?
        AND datetime(borrow_date) < datetime(?)
        AND datetime(borrow_date) >= datetime(?)
        AND status IN ('borrowed', 'returned')
      LIMIT 1
    `,
      )
      .get(userId, weekEnd.toISOString(), weekStart.toISOString());
    if (anyBorrow) {
      streak++;
      weekEnd = weekStart;
    } else break;
  }

  const collab = db
    .prepare(
      `
    WITH mine AS (SELECT DISTINCT book_id FROM borrowings WHERE user_id = ?),
    peers AS (
      SELECT DISTINCT br2.user_id
      FROM borrowings br1
      JOIN borrowings br2 ON br1.book_id = br2.book_id AND br2.user_id != ?
      WHERE br1.user_id = ?
    ),
    suggested AS (
      SELECT br.book_id, COUNT(*) as w
      FROM borrowings br
      WHERE br.user_id IN (SELECT user_id FROM peers)
        AND br.book_id NOT IN (SELECT book_id FROM mine)
      GROUP BY br.book_id
      ORDER BY w DESC
      LIMIT 8
    )
    SELECT b.* FROM suggested s JOIN books b ON b.id = s.book_id WHERE b.available_copies > 0 LIMIT 5
  `,
    )
    .all(userId, userId, userId) as Record<string, unknown>[];

  const payload = {
    genre_breakdown,
    books_total,
    books_reading_now,
    dna_note:
      books_reading_now > 0
        ? 'Finished titles count as read; active loans count toward your current interests at half weight.'
        : 'Stats use returned loans as “finished”; borrow a book to see current interests.',
    avg_per_month: Math.round(avg_per_month * 10) / 10,
    estimated_pages: Math.round(totalPages),
    taste_label,
    reading_streak_weeks: streak,
    because_you_read: collab,
  };

  try {
    db.prepare(
      `
    INSERT INTO reading_dna (user_id, genre_breakdown, books_total, avg_per_month, taste_label, last_calculated)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      genre_breakdown = excluded.genre_breakdown,
      books_total = excluded.books_total,
      avg_per_month = excluded.avg_per_month,
      taste_label = excluded.taste_label,
      last_calculated = excluded.last_calculated
  `,
    ).run(userId, JSON.stringify(genre_breakdown), books_total, avg_per_month, taste_label);
  } catch {
  }

  return payload;
}

app.get('/api/users', (req, res) => {
  res.json(db.prepare('SELECT * FROM users').all());
});

app.post('/api/users/register', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  try {
    const info = db.prepare('INSERT INTO users (name, email, role) VALUES (?, ?, ?)').run(name, email, 'student');
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ error: e.message?.includes('UNIQUE') ? 'Email already registered' : e.message || 'Could not register' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const requesterId = Number(req.body?.requester_id ?? req.query.requester_id);
  if (!Number.isFinite(id) || !Number.isFinite(requesterId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const requester = db.prepare('SELECT * FROM users WHERE id = ?').get(requesterId) as { role: string; id: number } | undefined;
  if (!requester) return res.status(403).json({ error: 'Unauthorized' });
  if (requester.id !== id && requester.role !== 'librarian') {
    return res.status(403).json({ error: 'You can only edit your own profile' });
  }
  const { name, email, avatar_url } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name required' });
  const prev = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as { email: string } | undefined;
  if (!prev) return res.status(404).json({ error: 'User not found' });
  const newEmail = typeof email === 'string' && email.trim() ? email.trim() : prev.email;
  const avatar = typeof avatar_url === 'string' && avatar_url.length < 600_000 ? avatar_url : null;
  try {
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name.trim(), newEmail, id);
    if (avatar !== null) {
      try {
        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatar, id);
      } catch {
      }
    }
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Update failed' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const librarianId = Number(req.query.librarianId ?? req.body?.librarian_id);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as { role: string } | undefined;
  if (!target || target.role !== 'student') return res.status(400).json({ error: 'Can only remove student accounts' });
  const active = db.prepare("SELECT count(*) as n FROM borrowings WHERE user_id = ? AND status = 'borrowed'").get(id) as {
    n: number;
  };
  if (active.n > 0) return res.status(400).json({ error: 'Student has active loans — process returns first' });
  try {
    db.prepare('DELETE FROM borrowings WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM reservations WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM reviews WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM reading_dna WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/books', (req, res) => {
  res.json(db.prepare('SELECT * FROM books').all());
});

app.get('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, isbn, total_copies, genre, publication_year, author_nationality, kids_friendly } = req.body;
  try {
    const kf = kids_friendly ? 1 : 0;
    const sp = req.body.is_staff_pick ? 1 : 0;
    const spNote = typeof req.body.staff_pick_note === 'string' ? req.body.staff_pick_note : null;
    const info = db
      .prepare(
        'INSERT INTO books (title, author, isbn, total_copies, available_copies, genre, publication_year, author_nationality, kids_friendly, is_staff_pick, staff_pick_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        title,
        author,
        isbn,
        total_copies,
        total_copies,
        genre || null,
        publication_year || null,
        author_nationality || null,
        kf,
        sp,
        spNote,
      );
    res.json({
      id: info.lastInsertRowid,
      title,
      author,
      isbn,
      total_copies,
      available_copies: total_copies,
      genre,
      publication_year,
      author_nationality,
      kids_friendly: kf,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, total_copies, genre, publication_year, author_nationality, kids_friendly } = req.body;

  const updateTransaction = db.transaction(() => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!book) throw new Error('Book not found');

    const diff = total_copies - book.total_copies;
    const new_available = book.available_copies + diff;

    if (new_available < 0) {
      throw new Error('Cannot reduce total copies below currently borrowed copies');
    }

    const kf = kids_friendly ? 1 : 0;
    const sp = req.body.is_staff_pick ? 1 : 0;
    const spNote = typeof req.body.staff_pick_note === 'string' ? req.body.staff_pick_note : null;
    db.prepare(
      'UPDATE books SET title = ?, author = ?, isbn = ?, total_copies = ?, available_copies = ?, genre = ?, publication_year = ?, author_nationality = ?, kids_friendly = ?, is_staff_pick = ?, staff_pick_note = ? WHERE id = ?',
    ).run(
      title,
      author,
      isbn,
      total_copies,
      new_available,
      genre || null,
      publication_year || null,
      author_nationality || null,
      kf,
      sp,
      spNote,
      id,
    );
  });

  try {
    updateTransaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;

  const deleteTransaction = db.transaction(() => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as any;
    if (!book) throw new Error('Book not found');

    if (book.available_copies !== book.total_copies) {
      throw new Error('Cannot delete book while copies are borrowed');
    }

    const activeReservations = db.prepare('SELECT count(*) as count FROM reservations WHERE book_id = ? AND status = ?').get(id, 'active') as any;
    if (activeReservations.count > 0) {
      throw new Error('Cannot delete book with active reservations');
    }

    db.prepare('DELETE FROM borrowings WHERE book_id = ?').run(id);
    db.prepare('DELETE FROM reservations WHERE book_id = ?').run(id);
    db.prepare('DELETE FROM books WHERE id = ?').run(id);
  });

  try {
    deleteTransaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/borrow', (req, res) => {
  const { book_id, user_id } = req.body;
  const bid = Number(book_id);
  const uid = Number(user_id);

  const borrowTransaction = db.transaction(() => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bid) as any;
    if (!book || book.available_copies <= 0) {
      throw new Error('Book not available');
    }

    const dup = db
      .prepare("SELECT 1 FROM borrowings WHERE user_id = ? AND book_id = ? AND status = 'borrowed' LIMIT 1")
      .get(uid, bid);
    if (dup) {
      throw new Error('You already have a copy of this book on loan');
    }

    const tooSoon = db
      .prepare(
        `
      SELECT 1 FROM borrowings
      WHERE user_id = ? AND book_id = ? AND status = 'returned'
        AND datetime(return_date) > datetime('now', '-14 days')
      LIMIT 1
    `,
      )
      .get(uid, bid);
    if (tooSoon) {
      throw new Error('You can borrow this title again 14 days after your last return');
    }

    const borrowDate = new Date().toISOString();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const info = db
      .prepare(
        'INSERT INTO borrowings (book_id, user_id, borrow_date, due_date, status, renew_count, renew_extra_allowed) VALUES (?, ?, ?, ?, ?, 0, 0)',
      )
      .run(bid, uid, borrowDate, dueDate.toISOString(), 'borrowed');

    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bid);

    return info.lastInsertRowid;
  });

  try {
    const id = borrowTransaction();
    res.json({ success: true, borrowing_id: id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/return', (req, res) => {
  const { borrowing_id } = req.body;

  const returnTransaction = db.transaction(() => {
    const borrowing = db.prepare('SELECT * FROM borrowings WHERE id = ?').get(borrowing_id) as any;
    if (!borrowing || borrowing.status === 'returned') {
      throw new Error('Invalid borrowing record');
    }

    const returnDate = new Date().toISOString();

    db.prepare('UPDATE borrowings SET status = ?, return_date = ? WHERE id = ?').run('returned', returnDate, borrowing_id);

    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(borrowing.book_id);
  });

  try {
    returnTransaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/borrowings', (req, res) => {
  const filterUid = Number(req.query.userId);
  let sql = `
    SELECT b.id, b.book_id, b.user_id, b.borrow_date, b.due_date, b.return_date, b.status,
           b.renew_count, b.renew_extra_allowed,
           bk.title as book_title, bk.author as book_author,
           u.name as user_name, u.email as user_email
    FROM borrowings b
    JOIN books bk ON b.book_id = bk.id
    JOIN users u ON b.user_id = u.id
  `;
  const params: number[] = [];
  if (Number.isFinite(filterUid) && filterUid > 0) {
    sql += ' WHERE b.user_id = ?';
    params.push(filterUid);
  }
  sql += ' ORDER BY b.borrow_date DESC';
  const borrowings = db.prepare(sql).all(...params);
  res.json(borrowings);
});

app.post('/api/librarian/borrowings/:id/allow-renew', (req, res) => {
  const id = Number(req.params.id);
  const librarianId = Number(req.body?.librarian_id ?? req.query.librarianId);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const br = db.prepare('SELECT * FROM borrowings WHERE id = ?').get(id) as {
    status: string;
    renew_count: number;
    renew_extra_allowed: number;
  } | undefined;
  if (!br || br.status !== 'borrowed') return res.status(400).json({ error: 'Active loan not found' });
  if (Number(br.renew_count) !== 1 || Number(br.renew_extra_allowed) === 1) {
    return res.status(400).json({
      error: 'Grant only after the patron has renewed once, and only if a second renew is not already approved.',
    });
  }
  db.prepare('UPDATE borrowings SET renew_extra_allowed = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/reserve', (req, res) => {
  const { book_id, user_id } = req.body;

  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id) as any;
    if (!book) {
      throw new Error('Book not found');
    }
    if (book.available_copies > 0) {
      throw new Error('Book is currently available, you can borrow it directly');
    }

    const existing = db.prepare('SELECT * FROM reservations WHERE book_id = ? AND user_id = ? AND status = ?').get(book_id, user_id, 'active');
    if (existing) {
      throw new Error('You already have an active reservation for this book');
    }

    const reservationDate = new Date().toISOString();
    const info = db
      .prepare('INSERT INTO reservations (book_id, user_id, reservation_date, status) VALUES (?, ?, ?, ?)')
      .run(book_id, user_id, reservationDate, 'active');

    res.json({ success: true, reservation_id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reservations', (req, res) => {
  const reservations = db
    .prepare(
      `
    SELECT r.id, r.reservation_date, r.status, 
           bk.title as book_title, bk.author as book_author,
           u.name as user_name, u.email as user_email
    FROM reservations r
    JOIN books bk ON r.book_id = bk.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.reservation_date DESC
  `,
    )
    .all();
  res.json(reservations);
});

app.get('/api/stats', (req, res) => {
  const books = db.prepare('SELECT count(*) as n FROM books').get() as { n: number };
  const users = db.prepare("SELECT count(*) as n FROM users WHERE role = 'student'").get() as { n: number };
  const out = db.prepare("SELECT count(*) as n FROM borrowings WHERE status = 'borrowed'").get() as { n: number };
  const resv = db.prepare("SELECT count(*) as n FROM reservations WHERE status = 'active'").get() as { n: number };
  res.json({
    totalBooks: books.n,
    studentCount: users.n,
    activeBorrowings: out.n,
    activeReservations: resv.n,
  });
});

app.get('/api/v1/books/random', (_req, res) => {
  let row = db
    .prepare('SELECT * FROM books WHERE available_copies > 0 ORDER BY RANDOM() LIMIT 1')
    .get() as Record<string, unknown> | undefined;
  if (!row) {
    row = db.prepare('SELECT * FROM books ORDER BY RANDOM() LIMIT 1').get() as Record<string, unknown> | undefined;
  }
  if (!row) return res.status(404).json({ error: 'No books in catalogue' });
  res.json(row);
});

app.get('/api/v1/search/suggest', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (q.length < 1) return res.json([]);
  const qq = `%${q}%`;
  const qisbn = `%${q.replace(/[-\s]/g, '')}%`;
  const rows = db
    .prepare(
      `
    SELECT id, title, author, isbn, genre FROM books
    WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR REPLACE(REPLACE(isbn, '-', ''), ' ', '') LIKE ?
    ORDER BY title ASC
    LIMIT 12
  `,
    )
    .all(qq, qq, qisbn);
  res.json(rows);
});

app.get('/api/v1/books/trending', (_req, res) => {
  let rows = db
    .prepare(
      `
    SELECT bk.id, bk.title, bk.author, bk.isbn, COUNT(*) as reader_count
    FROM borrowings br
    JOIN books bk ON br.book_id = bk.id
    WHERE datetime(br.borrow_date) >= datetime('now', '-7 days')
    GROUP BY bk.id
    ORDER BY reader_count DESC
    LIMIT 10
  `,
    )
    .all() as { id: number; title: string; author: string; isbn: string; reader_count: number }[];
  if (rows.length === 0) {
    rows = db
      .prepare(
        `
      SELECT bk.id, bk.title, bk.author, bk.isbn, COUNT(*) as reader_count
      FROM borrowings br
      JOIN books bk ON br.book_id = bk.id
      GROUP BY bk.id
      ORDER BY reader_count DESC
      LIMIT 10
    `,
      )
      .all() as { id: number; title: string; author: string; isbn: string; reader_count: number }[];
  }
  if (rows.length === 0) {
    rows = db
      .prepare(
        `
      SELECT id, title, author, isbn, 1 as reader_count FROM books
      ORDER BY id DESC
      LIMIT 10
    `,
      )
      .all() as { id: number; title: string; author: string; isbn: string; reader_count: number }[];
  }
  res.json(rows);
});

app.get('/api/v1/books/staff-picks', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM books WHERE is_staff_pick = 1 ORDER BY id DESC')
    .all();
  res.json(rows);
});

app.get('/api/v1/reviews/recommendations', (req, res) => {
  const cat = String(req.query.category || 'all').toLowerCase();
  let genreClause = '1=1';
  if (cat === 'fiction') genreClause = "(LOWER(COALESCE(bk.genre,'')) LIKE '%fiction%' AND LOWER(COALESCE(bk.genre,'')) NOT LIKE '%non%')";
  else if (cat === 'non-fiction' || cat === 'nonfiction')
    genreClause = "(LOWER(COALESCE(bk.genre,'')) LIKE '%non-fiction%' OR LOWER(COALESCE(bk.genre,'')) LIKE '%nonfiction%' OR LOWER(COALESCE(bk.genre,'')) LIKE '%biography%')";
  else if (cat === 'academic')
    genreClause = "(LOWER(COALESCE(bk.genre,'')) LIKE '%academic%' OR LOWER(COALESCE(bk.genre,'')) LIKE '%textbook%' OR LOWER(COALESCE(bk.genre,'')) LIKE '%science%')";

  const rows = db
    .prepare(
      `
    SELECT r.id, r.rating, r.blurb, u.name as user_name, bk.id as book_id, bk.title, bk.author, bk.isbn, bk.genre
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN books bk ON r.book_id = bk.id
    WHERE r.is_approved = 1 AND ${genreClause}
    ORDER BY r.created_at DESC
    LIMIT 12
  `,
    )
    .all();
  res.json(rows);
});

app.get('/api/v1/reviews/:bookId', (req, res) => {
  const bookId = Number(req.params.bookId);
  if (!Number.isFinite(bookId)) return res.status(400).json({ error: 'Invalid book id' });
  const rows = db
    .prepare(
      `
    SELECT r.id, r.rating, r.blurb, r.created_at, u.name as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.book_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC
  `,
    )
    .all(bookId);
  res.json(rows);
});

app.get('/api/v1/reviews/status', (req, res) => {
  const bid = Number(req.query.book_id);
  const uid = Number(req.query.user_id);
  if (!Number.isFinite(bid) || !Number.isFinite(uid)) return res.status(400).json({ error: 'Invalid book or user' });
  const row = db
    .prepare('SELECT id, rating, blurb, is_approved FROM reviews WHERE book_id = ? AND user_id = ?')
    .get(bid, uid) as { id: number; rating: number; blurb: string | null; is_approved: number } | undefined;
  res.json(row || null);
});

app.get('/api/v1/reviews/pending', (req, res) => {
  const librarianId = Number(req.query.librarianId);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  const rows = db
    .prepare(
      `
    SELECT r.*, bk.title as book_title, u.name as user_name
    FROM reviews r
    JOIN books bk ON r.book_id = bk.id
    JOIN users u ON r.user_id = u.id
    WHERE r.is_approved = 0
    ORDER BY r.created_at ASC
  `,
    )
    .all();
  res.json(rows);
});

app.post('/api/v1/reviews', (req, res) => {
  const { book_id, user_id, rating, blurb } = req.body;
  const bid = Number(book_id);
  const uid = Number(user_id);
  const r = Number(rating);
  if (!Number.isFinite(bid) || !Number.isFinite(uid) || !Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const blurbStr = typeof blurb === 'string' ? blurb.slice(0, 120) : '';
  const borrowedBefore = db
    .prepare(
      `
    SELECT 1 FROM borrowings
    WHERE book_id = ? AND user_id = ?
    LIMIT 1
  `,
    )
    .get(bid, uid);
  if (!borrowedBefore) {
    return res.status(403).json({ error: 'You can only review books you have borrowed at least once' });
  }
  try {
    const info = db
      .prepare(
        'INSERT INTO reviews (book_id, user_id, rating, blurb, is_approved) VALUES (?, ?, ?, ?, 0)',
      )
      .run(bid, uid, r, blurbStr || null);
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (e: any) {
    const msg = e?.message || '';
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return res.status(409).json({ error: 'You already submitted a review for this book' });
    }
    res.status(400).json({ error: msg || 'Could not save review' });
  }
});

app.put('/api/v1/admin/reviews/:id/approve', (req, res) => {
  const id = Number(req.params.id);
  const librarianId = Number(req.body?.librarian_id ?? req.query.librarianId);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  db.prepare('UPDATE reviews SET is_approved = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

app.delete('/api/v1/admin/reviews/:id', (req, res) => {
  const id = Number(req.params.id);
  const librarianId = Number(req.body?.librarian_id ?? req.query.librarianId);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const r = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Review not found' });
  res.json({ success: true });
});

app.get('/api/v1/admin/reviews/all', (req, res) => {
  const librarianId = Number(req.query.librarianId);
  const lib = db.prepare('SELECT role FROM users WHERE id = ?').get(librarianId) as { role: string } | undefined;
  if (!lib || lib.role !== 'librarian') return res.status(403).json({ error: 'Librarian only' });
  const rows = db
    .prepare(
      `
    SELECT r.id, r.rating, r.blurb, r.is_approved, r.created_at, bk.id as book_id, bk.title as book_title, u.name as user_name
    FROM reviews r
    JOIN books bk ON r.book_id = bk.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `,
    )
    .all();
  res.json(rows);
});

app.get('/api/v1/users/me/dna', (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isFinite(userId)) return res.status(400).json({ error: 'userId required' });
  try {
    const dna = computeReadingDna(userId);
    res.json(dna);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/books', (req, res) => {
  const page = parseIntParam(req.query.page, 1);
  const limit = Math.min(50, parseIntParam(req.query.limit, 10));
  const genre = typeof req.query.genre === 'string' ? req.query.genre.trim() : '';
  const year = typeof req.query.year === 'string' ? req.query.year.trim() : '';
  const nationality = typeof req.query.nationality === 'string' ? req.query.nationality.trim() : '';
  const kidsOnly = req.query.kids_only === '1' || req.query.kids_only === 'true';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'title';
  const order = String(req.query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const sortCol =
    sort === 'author' ? 'author' : sort === 'year' || sort === 'publication_year' ? 'publication_year' : 'title';

  const where: string[] = ['1=1'];
  const params: (string | number)[] = [];
  if (genre) {
    where.push('LOWER(COALESCE(genre, \'\')) = LOWER(?)');
    params.push(genre);
  }
  if (year && /^\d{4}$/.test(year)) {
    where.push('publication_year = ?');
    params.push(Number(year));
  }
  if (nationality) {
    where.push('LOWER(COALESCE(author_nationality, \'\')) = LOWER(?)');
    params.push(nationality);
  }
  if (kidsOnly) {
    where.push('kids_friendly = 1');
  }
  if (q) {
    where.push(
      "(LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR REPLACE(REPLACE(isbn, '-', ''), ' ', '') LIKE ?)",
    );
    const qq = `%${q}%`;
    const qisbn = `%${q.replace(/[-\s]/g, '')}%`;
    params.push(qq, qq, qisbn);
  }

  const whereSql = where.join(' AND ');
  const total = (
    db.prepare(`SELECT count(*) as n FROM books WHERE ${whereSql}`).get(...params) as { n: number }
  ).n;
  const offset = (page - 1) * limit;
  const data = db
    .prepare(`SELECT * FROM books WHERE ${whereSql} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  res.json({
    data,
    meta: { total, page, limit, totalPages },
  });
});

app.post('/api/renew', (req, res) => {
  const { borrowing_id, user_id } = req.body;
  const bid = Number(borrowing_id);
  const uid = Number(user_id);
  try {
    if (!Number.isFinite(bid) || !Number.isFinite(uid)) throw new Error('Invalid loan');
    const br = db.prepare('SELECT * FROM borrowings WHERE id = ?').get(bid) as any;
    if (!br || Number(br.user_id) !== uid || br.status !== 'borrowed') throw new Error('Invalid loan');
    const renewCount = Number(br.renew_count ?? 0);
    const extra = Number(br.renew_extra_allowed ?? 0);
    if (renewCount >= 2) throw new Error('Maximum renewals used for this loan');
    if (renewCount >= 1 && !(renewCount === 1 && extra === 1)) {
      throw new Error('You already renewed once — ask a librarian if you need more time');
    }
    const due = new Date(br.due_date);
    due.setDate(due.getDate() + 14);
    const nextCount = renewCount + 1;
    const nextExtra = renewCount === 1 && extra === 1 ? 0 : extra;
    db.prepare('UPDATE borrowings SET due_date = ?, renew_count = ?, renew_extra_allowed = ? WHERE id = ?').run(
      due.toISOString(),
      nextCount,
      nextExtra,
      bid,
    );
    res.json({ success: true, due_date: due.toISOString() });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
