import express from "express";
import cors from "cors";
import * as store from "./booksStore.js";
import { parseId, validateBook, validateMerged, findDuplicate } from "./validate.js";

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/books", async (req, res) => {
  const books = await store.getAll();
  res.json(books);
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

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});