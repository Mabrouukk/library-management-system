const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const SALT_ROUNDS = 10;
const MAX_BORROW = 5;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// --- DATA STRUCTURES ---

let USERS = [
  // Sample admin user
  { username: 'Mahmoud', password: bcrypt.hashSync('1234', SALT_ROUNDS), isAdmin: true, history: [], borrowedBooks: [] },
  // Regular users
  { username: 'Marina', password: bcrypt.hashSync('1234', SALT_ROUNDS), isAdmin: false, history: [], borrowedBooks: [] },
  { username: 'Sham', password: bcrypt.hashSync('1234', SALT_ROUNDS), isAdmin: false, history: [], borrowedBooks: [] },
  { username: 'Adel', password: bcrypt.hashSync('1234', SALT_ROUNDS), isAdmin: false, history: [], borrowedBooks: [] }
];

let BOOKS = [
  { id: 1, title: "Clean Code", author: "Robert C. Martin", genre: "Programming" },
  { id: 2, title: "The Pragmatic Programmer", author: "Andrew Hunt", genre: "Programming" },
  { id: 3, title: "Harry Potter", author: "J.K. Rowling", genre: "Fantasy" },
  { id: 4, title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { id: 5, title: "1984", author: "George Orwell", genre: "Dystopian" },
  { id: 6, title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Classic" },
  { id: 7, title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic" },
  { id: 8, title: "Moby Dick", author: "Herman Melville", genre: "Classic" },
  { id: 9, title: "War and Peace", author: "Leo Tolstoy", genre: "Classic" },
  { id: 10, title: "Pride and Prejudice", author: "Jane Austen", genre: "Classic" },
  { id: 11, title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Classic" },
  { id: 12, title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian" },
  { id: 13, title: "Animal Farm", author: "George Orwell", genre: "Dystopian" },
  { id: 14, title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy" },
  { id: 15, title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Dystopian" },
  { id: 16, title: "Jane Eyre", author: "Charlotte Brontë", genre: "Classic" },
  { id: 17, title: "Wuthering Heights", author: "Emily Brontë", genre: "Classic" },
  { id: 18, title: "The Alchemist", author: "Paulo Coelho", genre: "Adventure" },
  { id: 19, title: "The Da Vinci Code", author: "Dan Brown", genre: "Thriller" },
  { id: 20, title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genre: "Thriller" },
  { id: 21, title: "Gone Girl", author: "Gillian Flynn", genre: "Thriller" },
  { id: 22, title: "The Shining", author: "Stephen King", genre: "Horror" },
  { id: 23, title: "Dracula", author: "Bram Stoker", genre: "Horror" },
  { id: 24, title: "Frankenstein", author: "Mary Shelley", genre: "Horror" },
  { id: 25, title: "The Art of Computer Programming", author: "Donald Knuth", genre: "Programming" },
  { id: 26, title: "You Don't Know JS", author: "Kyle Simpson", genre: "Programming" },
  { id: 27, title: "Eloquent JavaScript", author: "Marijn Haverbeke", genre: "Programming" },
  { id: 28, title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", genre: "Programming" },
  { id: 29, title: "Refactoring", author: "Martin Fowler", genre: "Programming" },
  { id: 30, title: "Design Patterns", author: "Erich Gamma", genre: "Programming" }
];
let nextBookId = 6;

// --- AUTH MIDDLEWARE ---

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  const user = USERS.find(u => u.username === req.session.user);
  if (!user || !user.isAdmin) return res.status(403).send('Admin only');
  next();
}

// --- ROUTES ---

// Home/Login/Register
app.get('/', (req, res) => res.redirect('/dashboard'));
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

// Register handler
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (USERS.find(u => u.username === username)) {
    return res.render('register', { error: 'Username already taken' });
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  USERS.push({ username, password: hash, isAdmin: false, history: [], borrowedBooks: [] });
  res.redirect('/login');
});

// Login handler
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = username;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Dashboard
app.get('/dashboard', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  res.render('dashboard', {
    username: user.username,
    isAdmin: user.isAdmin,
    booksBorrowed: user.borrowedBooks.length,
    borrowedBooks: user.borrowedBooks,
    allBooks: BOOKS
  });
});

// User Profile
app.get('/profile', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  res.render('profile', { user, error: null, success: null });
});

// Edit Profile (change username)
app.post('/profile/edit', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  const { newUsername } = req.body;
  if (!newUsername || USERS.find(u => u.username === newUsername)) {
    return res.render('profile', { user, error: 'Invalid or taken username', success: null });
  }
  user.username = newUsername;
  req.session.user = newUsername;
  res.render('profile', { user, error: null, success: 'Username updated!' });
});

// Change Password
app.post('/profile/password', requireLogin, async (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  const { oldPassword, newPassword } = req.body;
  if (!await bcrypt.compare(oldPassword, user.password)) {
    return res.render('profile', { user, error: 'Old password incorrect', success: null });
  }
  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  res.render('profile', { user, error: null, success: 'Password changed!' });
});

// Delete Account
app.post('/profile/delete', requireLogin, (req, res) => {
  USERS = USERS.filter(u => u.username !== req.session.user);
  req.session.destroy(() => res.redirect('/register'));
});

// --- BOOK INVENTORY MANAGEMENT (ADMIN) ---

// List books with search/filter
app.get('/books', requireLogin, (req, res) => {
  let { q, genre, author } = req.query;
  let filtered = BOOKS;
  if (q) filtered = filtered.filter(b => b.title.toLowerCase().includes(q.toLowerCase()));
  if (genre) filtered = filtered.filter(b => b.genre === genre);
  if (author) filtered = filtered.filter(b => b.author.toLowerCase().includes(author.toLowerCase()));
  // Get unique genres/authors for filter dropdowns
  const genres = [...new Set(BOOKS.map(b => b.genre))];
  const authors = [...new Set(BOOKS.map(b => b.author))];
  res.render('books', { books: filtered, genres, authors, q: q || '', genre: genre || '', author: author || '', isAdmin: USERS.find(u => u.username === req.session.user).isAdmin });
});

// Add book (admin)
app.get('/books/add', requireAdmin, (req, res) => res.render('book_add', { error: null }));
app.post('/books/add', requireAdmin, (req, res) => {
  const { title, author, genre } = req.body;
  if (!title || !author || !genre) return res.render('book_add', { error: 'All fields required' });
  BOOKS.push({ id: nextBookId++, title, author, genre });
  res.redirect('/books');
});

// Edit book (admin)
app.get('/books/edit/:id', requireAdmin, (req, res) => {
  const book = BOOKS.find(b => b.id == req.params.id);
  if (!book) return res.send('Book not found');
  res.render('book_edit', { book, error: null });
});
app.post('/books/edit/:id', requireAdmin, (req, res) => {
  const book = BOOKS.find(b => b.id == req.params.id);
  const { title, author, genre } = req.body;
  if (!title || !author || !genre) return res.render('book_edit', { book, error: 'All fields required' });
  book.title = title; book.author = author; book.genre = genre;
  res.redirect('/books');
});

// Delete book (admin)
app.post('/books/delete/:id', requireAdmin, (req, res) => {
  BOOKS = BOOKS.filter(b => b.id != req.params.id);
  res.redirect('/books');
});

// --- BORROWING/RETURNING ---

// Borrow book
app.get('/borrow', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  // Only show books not already borrowed
  const availableBooks = BOOKS.filter(b => !user.borrowedBooks.some(bb => bb.id === b.id));
  res.render('borrow', { books: availableBooks, borrowedCount: user.borrowedBooks.length, maxBorrow: MAX_BORROW, error: null });
});

app.post('/borrow', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  const bookId = parseInt(req.body.bookId);
  if (user.borrowedBooks.length >= MAX_BORROW) {
    return res.render('borrow', { books: BOOKS.filter(b => !user.borrowedBooks.some(bb => bb.id === b.id)), borrowedCount: user.borrowedBooks.length, maxBorrow: MAX_BORROW, error: 'Borrowing limit reached' });
  }
  if (!BOOKS.find(b => b.id === bookId)) {
    return res.render('borrow', { books: BOOKS.filter(b => !user.borrowedBooks.some(bb => bb.id === b.id)), borrowedCount: user.borrowedBooks.length, maxBorrow: MAX_BORROW, error: 'Book not found' });
  }
  if (user.borrowedBooks.some(b => b.id === bookId)) {
    return res.render('borrow', { books: BOOKS.filter(b => !user.borrowedBooks.some(bb => bb.id === b.id)), borrowedCount: user.borrowedBooks.length, maxBorrow: MAX_BORROW, error: 'Already borrowed' });
  }
  const book = BOOKS.find(b => b.id === bookId);
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.borrowedBooks.push({ ...book, dueDate });
  user.history.push({ ...book, action: 'borrowed', date: new Date() });
  res.redirect('/dashboard');
});

// Return book
app.post('/return', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  const bookId = parseInt(req.body.bookId);
  const book = user.borrowedBooks.find(b => b.id === bookId);
  if (book) {
    user.borrowedBooks = user.borrowedBooks.filter(b => b.id !== bookId);
    user.history.push({ ...book, action: 'returned', date: new Date() });
  }
  res.redirect('/dashboard');
});

// Borrowing history
app.get('/history', requireLogin, (req, res) => {
  const user = USERS.find(u => u.username === req.session.user);
  res.render('history', { history: user.history });
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
