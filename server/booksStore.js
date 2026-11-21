// In-memory data source. The array is NEVER modified in place:
// every change builds a new array (or a new object) and replaces the old one.

const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

let books = [
  { id: 1, title: "Dune", author: "Frank Herbert", year: 1965, genre: "fiction", read: true, rating: 5 },
  { id: 2, title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, genre: "fantasy", read: true, rating: 4 },
  { id: 3, title: "A Brief History of Time", author: "Stephen Hawking", year: 1988, genre: "science", read: true, rating: 5 },
  { id: 4, title: "Sapiens", author: "Yuval Noah Harari", year: 2011, genre: "history", read: true, rating: 4 },
  { id: 5, title: "The Name of the Wind", author: "Patrick Rothfuss", year: 2007, genre: "fantasy", read: false, rating: null },
  { id: 6, title: "Cosmos", author: "Carl Sagan", year: 1980, genre: "science", read: false, rating: null },
  { id: 7, title: "1984", author: "George Orwell", year: 1949, genre: "fiction", read: false, rating: null },
];

let nextId = 8;

// Simulates a slow data source
const delay = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

export { GENRES };

export async function getAll() {
  await delay();
  return books;
}

export async function getById(id) {
  await delay();
  return books.find((book) => book.id === id) ?? null;
}

export async function create(data) {
  await delay();
  const book = { ...data, id: nextId };
  nextId += 1;
  books = [...books, book];
  return book;
}

export async function replace(id, data) {
  await delay();
  const existing = books.find((book) => book.id === id);
  if (!existing) return null;
  const updated = { ...data, id };
  books = books.map((book) => (book.id === id ? updated : book));
  return updated;
}

export async function remove(id) {
  await delay();
  const exists = books.some((book) => book.id === id);
  if (!exists) return false;
  books = books.filter((book) => book.id !== id);
  return true;
}