import express from "express";
import cors from "cors";
import * as store from "./booksStore.js";
import { parseId, validateBook, findDuplicate } from "./validate.js";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// CORS: only the exact origin of the client is allowed
app.use(cors({ origin: CLIENT_ORIGIN }));

// Body parsing: registered BEFORE the routes
app.use(express.json());

// GET /api/books: list of books (query options come in a later step)
app.get("/api/books", async (req, res) => {
  const books = await store.getAll();
  res.status(200).json(books);
});

// GET /api/books/:id: one book
app.get("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }

  const book = await store.getById(id);
  if (!book) {
    return res.status(404).json({ error: `Book with id ${id} was not found` });
  }

  res.status(200).json(book);
});

// POST /api/books: create a book from a complete body
app.post("/api/books", async (req, res) => {
  const result = validateBook(req.body);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  const books = await store.getAll();
  const duplicate = findDuplicate(result.value, books);
  if (duplicate) {
    return res.status(409).json({
      error: `A book with the same title and author already exists (id ${duplicate.id})`,
    });
  }

  const book = await store.create(result.value);
  res.status(201).location(`/api/books/${book.id}`).json(book);
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});