const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Mock data
const USER = [
  { username: 'admin', password: '1234' },
  { username: 'Mahmoud', password: '1234' }
];

const BOOKS = [
  { id: 1, title: "Clean Code" },
  { id: 2, title: "The Pragmatic Programmer" },
  { id: 3, title: "Introduction to Algorithms" },
  { id: 4, title: "Design Patterns" },
  { id: 5, title: "Refactoring" },
  // ... add more books
];

const today = new Date();
const booksOverdue = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

// Routes

// Login page
app.get('/', (req, res) => res.render('login', { error: null }));
app.get('/login', (req, res) => res.render('login', { error: null }));

// Register page
app.get('/register', (req, res) => res.render('register', { error: null }));

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('dashboard', {
    username: req.session.user,
    booksBorrowed: req.session.borrowed || 0,
    booksOverdue,
    borrowedBooks: req.session.borrowedBooks || [],
    books: BOOKS
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});
app.get('/borrow', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('borrow', {
  books: BOOKS,
  borrowedBooks: req.session.borrowedBooks || [],
  booksBorrowed: req.session.borrowed || 0
});

});

// Login handler
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USER.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = username;
    req.session.borrowed = 0;
    req.session.borrowedBooks = [];
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

// Register handler
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (USER.find(u => u.username === username)) {
    return res.render('register', { error: 'Username already taken' });
  }
  USER.push({ username, password });
  res.redirect('/');
});

// Borrow book
app.post('/borrow', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const bookId = parseInt(req.body.bookId);
  const book = BOOKS.find(b => b.id === bookId);
  if (book) {
    req.session.borrowedBooks = req.session.borrowedBooks || [];
    if (!req.session.borrowedBooks.some(b => b.id === bookId)) {
      req.session.borrowedBooks.push(book);
      req.session.borrowed = (req.session.borrowed || 0) + 1;
    }
  }
  res.redirect('/dashboard');
});

// Return book
app.post('/return', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const bookId = parseInt(req.body.bookId);
  req.session.borrowedBooks = req.session.borrowedBooks || [];
  req.session.borrowedBooks = req.session.borrowedBooks.filter(b => b.id !== bookId);
  req.session.borrowed = Math.max((req.session.borrowed || 1) - 1, 0);
  res.redirect('/dashboard');
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
