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
  { username: 'Marina', password: 'Marina1234' },
];

const BOOKS = [
  { id: 1, title: "Clean Code" },
  { id: 2, title: "The Pragmatic Programmer" },
  { id: 3, title: "Introduction to Algorithms" },
  { id: 4, title: "Design Patterns" },
  { id: 5, title: "Refactoring" },
  { id: 6, title: "You Don't Know JS" },
  { id: 7, title: "JavaScript: The Good Parts" },
  { id: 8, title: "Eloquent JavaScript" },
  { id: 9, title: "Cracking the Coding Interview" },
  { id: 10, title: "Head First Design Patterns" },
  { id: 11, title: "Effective Java" },
  { id: 12, title: "The Art of Computer Programming" },
  { id: 13, title: "Code Complete" },
  { id: 14, title: "Structure and Interpretation of Computer Programs" },
  { id: 15, title: "Algorithms Unlocked" },
  { id: 16, title: "Python Crash Course" },
  { id: 17, title: "Automate the Boring Stuff with Python" },
  { id: 18, title: "Fluent Python" },
  { id: 19, title: "Learning Python" },
  { id: 20, title: "Grokking Algorithms" },
  { id: 21, title: "The Mythical Man-Month" },
  { id: 22, title: "Refactoring UI" },
  { id: 23, title: "The Clean Coder" },
  { id: 24, title: "Continuous Delivery" },
  { id: 25, title: "Site Reliability Engineering" },
  { id: 26, title: "The Phoenix Project" },
  { id: 27, title: "The DevOps Handbook" },
  { id: 28, title: "Soft Skills: The Software Developer's Life Manual" },
  { id: 29, title: "Peopleware" },
  { id: 30, title: "Working Effectively with Legacy Code" },
  { id: 31, title: "Test-Driven Development: By Example" },
  { id: 32, title: "Agile Software Development, Principles, Patterns, and Practices" },
  { id: 33, title: "The Art of Agile Development" },
  { id: 34, title: "Don't Make Me Think" },
  { id: 35, title: "The Pragmatic Programmer: 20th Anniversary Edition" },
  { id: 36, title: "Programming Pearls" },
  { id: 37, title: "Introduction to the Theory of Computation" },
  { id: 38, title: "Compilers: Principles, Techniques, and Tools" },
  { id: 39, title: "Operating System Concepts" },
  { id: 40, title: "Computer Networks" },
  { id: 41, title: "Modern Operating Systems" },
  { id: 42, title: "Artificial Intelligence: A Modern Approach" },
  { id: 43, title: "Deep Learning" },
  { id: 44, title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow" },
  { id: 45, title: "Data Science from Scratch" },
  { id: 46, title: "The Data Warehouse Toolkit" },
  { id: 47, title: "Database System Concepts" },
  { id: 48, title: "SQL Antipatterns" },
  { id: 49, title: "Learning SQL" },
  { id: 50, title: "MongoDB: The Definitive Guide" },
  { id: 51, title: "RESTful Web APIs" },
  { id: 52, title: "Web Development with Node and Express" },
  { id: 53, title: "Learning React" },
  { id: 54, title: "Fullstack React" },
  { id: 55, title: "Vue.js Up and Running" },
  { id: 56, title: "Pro Git" },
  { id: 57, title: "The Linux Command Line" },
  { id: 58, title: "Docker Deep Dive" },
  { id: 59, title: "Kubernetes Up & Running" },
  { id: 60, title: "Clean Architecture" }
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
