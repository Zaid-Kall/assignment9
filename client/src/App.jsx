import { useEffect, useState } from "react";
import { listBooks } from "./api.js";
import BookControls from "./components/BookControls.jsx";
import BookList from "./components/BookList.jsx";
import "./App.css";

const PAGE_SIZE = 5;
const initialFilters = { q: "", genre: "", read: "", sort: "", order: "asc" };

function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ key: "", items: [], total: 0, error: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const { genre, read, sort, order } = filters;
  const requestKey = [debouncedQ, genre, read, sort, order, page].join("|");

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

  function handleChange(changes) {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  }

  function handleReset() {
    setFilters(initialFilters);
    setDebouncedQ("");
    setPage(1);
  }

  return (
    <main className="app">
      <h1>Reading List</h1>

      <BookControls filters={filters} onChange={handleChange} onReset={handleReset} />

      <BookList
        books={result.items}
        loading={loading}
        error={result.error}
        filtered={Boolean(debouncedQ || genre || read)}
      />

      {!loading && !result.error && result.total > 0 && (
        <nav className="pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({result.total} books)
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