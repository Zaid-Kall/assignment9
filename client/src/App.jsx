import { useEffect, useState } from "react";
import { createBook, listBooks, updateBook } from "./api.js";
import BookControls from "./components/BookControls.jsx";
import BookForm from "./components/BookForm.jsx";
import BookList from "./components/BookList.jsx";
import "./App.css";

const PAGE_SIZE = 5;
const initialFilters = { q: "", genre: "", read: "", sort: "", order: "asc" };

function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);
  const [form, setForm] = useState(null);
  const [result, setResult] = useState({ key: "", items: [], total: 0, error: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const { genre, read, sort, order } = filters;
  const requestKey = [debouncedQ, genre, read, sort, order, page, reloadCount].join("|");

  useEffect(() => {
    let ignore = false;

    listBooks({
      q: debouncedQ,
      genre,
      read,
      sort,
      order: sort ? order : "",
      page,
      limit: PAGE_SIZE,
    })
      .then(({ items, total }) => {
        if (!ignore) setResult({ key: requestKey, items, total, error: "" });
      })
      .catch((err) => {
        if (!ignore) setResult({ key: requestKey, items: [], total: 0, error: err.message });
      });

    return () => {
      ignore = true;
    };
  }, [requestKey, debouncedQ, genre, read, sort, order, page]);

  const loading = result.key !== requestKey;
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  function reload() {
    setReloadCount((count) => count + 1);
  }

  function handleChange(changes) {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  }

  function handleReset() {
    setFilters(initialFilters);
    setDebouncedQ("");
    setPage(1);
  }

  function handleEdit(book) {
    setForm({ book });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(payload) {
    if (form.book) {
      await updateBook(form.book.id, payload);
    } else {
      await createBook(payload);
    }
    setForm(null);
    reload();
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Reading List</h1>
        {!form && (
          <button type="button" onClick={() => setForm({ book: null })}>
            Add book
          </button>
        )}
      </header>

      {form && (
        <BookForm
          key={form.book ? form.book.id : "new"}
          book={form.book}
          onSubmit={handleSave}
          onCancel={() => setForm(null)}
        />
      )}

      <BookControls filters={filters} onChange={handleChange} onReset={handleReset} />

      <BookList
        books={result.items}
        loading={loading}
        error={result.error}
        filtered={Boolean(debouncedQ || genre || read)}
        onEdit={handleEdit}
        onRetry={reload}
      />

      {!loading && !result.error && result.total > 0 && (
        <nav className="pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({result.total} {result.total === 1 ? "book" : "books"})
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

export default App;