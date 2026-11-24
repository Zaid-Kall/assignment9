import { useState } from "react";
import { GENRES } from "../constants.js";

function BookForm({ book, onSubmit, onCancel }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [year, setYear] = useState(book ? String(book.year) : "");
  const [genre, setGenre] = useState(book?.genre ?? "fiction");
  const [read, setRead] = useState(book?.read ?? false);
  const [rating, setRating] = useState(book?.rating != null ? String(book.rating) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSubmit({
        title,
        author,
        year: year === "" ? null : Number(year),
        genre,
        read,
        rating: read && rating !== "" ? Number(rating) : null,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{book ? "Edit book" : "Add a book"}</h2>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        Author
        <input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>

      <label>
        Year
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
      </label>

      <label>
        Genre
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox">
        <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
        I have read this book
      </label>

      <label>
        Rating
        <select value={rating} disabled={!read} onChange={(e) => setRating(e.target.value)}>
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <ul className="form-errors">
          {error.split("; ").map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default BookForm;