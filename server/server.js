import express from "express";
import cors from "cors";
import * as store from "./booksStore.js";
import { parseId, validateBook, validateMerged, findDuplicate } from "./validate.js";
import { applyQuery } from "./query.js";

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, exposedHeaders: ["X-Total-Count", "Location"] }));
app.use(express.json());

app.get("/api/stats", async (req, res) => {
  const books = await store.getAll();

  const readBooks = books.filter((b) => b.read);
  const rated = books.filter((b) => typeof b.rating === "number");
  const ratingSum = rated.reduce((sum, b) => sum + b.rating, 0);

  const byGenre = {};
  for (const book of books) {
    byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
  }

  res.json({
    total: books.length,
    read: readBooks.length,
    unread: books.length - readBooks.length,
    averageRating: rated.length > 0 ? Math.round((ratingSum / rated.length) * 100) / 100 : null,
    byGenre,
  });
});

// Deliberate crash: proves that an error thrown inside an async handler
// reaches the error-handling middleware (documented in the README)
app.get("/api/crash", async () => {
  await Promise.resolve();
  throw new Error("Deliberate crash to test the error handler");
});

app.get("/api/books", async (req, res) => {
  const books = await store.getAll();

  const result = applyQuery(books, req.query);
  if (!result.ok) return res.status(400).json({ error: result.error });

  res.set("X-Total-Count", String(result.total));
  res.json(result.items);
});

app.get("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id must be a positive integer" });

  const book = await store.getById(id);
  if (!book) return res.status(404).json({ error: `Book ${id} not found` });

  res.json(book);
});

app.post("/api/books", async (req, res) => {
  const result = validateBook(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });

  const books = await store.getAll();
  const duplicate = findDuplicate(result.value, books);
  if (duplicate) {
    return res.status(409).json({ error: `A book with the same title and author already exists (id ${duplicate.id})` });
  }

  const book = await store.create(result.value);
  res.status(201).location(`/api/books/${book.id}`).json(book);
});

app.put("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id must be a positive integer" });

  const existing = await store.getById(id);
  if (!existing) return res.status(404).json({ error: `Book ${id} not found` });

  const result = validateBook(req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });

  const books = await store.getAll();
  const duplicate = findDuplicate(result.value, books, id);
  if (duplicate) {
    return res.status(409).json({ error: `A book with the same title and author already exists (id ${duplicate.id})` });
  }

  const book = await store.replace(id, result.value);
  res.json(book);
});

app.patch("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id must be a positive integer" });

  const existing = await store.getById(id);
  if (!existing) return res.status(404).json({ error: `Book ${id} not found` });

  const result = validateMerged(existing, req.body);
  if (!result.ok) return res.status(400).json({ error: result.error });

  const books = await store.getAll();
  const duplicate = findDuplicate(result.value, books, id);
  if (duplicate) {
    return res.status(409).json({ error: `A book with the same title and author already exists (id ${duplicate.id})` });
  }

  const book = await store.replace(id, result.value);
  res.json(book);
});

app.delete("/api/books/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "id must be a positive integer" });

  const removed = await store.remove(id);
  if (!removed) return res.status(404).json({ error: `Book ${id} not found` });

  res.status(204).end();
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last, and must have 4 parameters)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});