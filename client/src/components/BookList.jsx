function BookList({
  books,
  loading,
  error,
  filtered,
  onEdit,
  onRetry,
  onToggleRead,
  onRate,
  onDelete,
}) {
  if (loading) {
    return <p className="message">Loading books...</p>;
  }

  if (error) {
    return (
      <div className="message error">
        <p>Error: {error}</p>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <p className="message">
        {filtered ? "No books match your search." : "Your reading list is empty."}
      </p>
    );
  }

  return (
    <ul className="book-list">
      {books.map((book) => (
        <li key={book.id} className="book">
          <div>
            <h2>{book.title}</h2>
            <p className="meta">
              {book.author} · {book.year} · {book.genre}
            </p>
          </div>
          <div className="status">
            <span className={book.read ? "badge read" : "badge"}>
              {book.read ? "Read" : "Unread"}
            </span>

            {book.read && (
              <select
                className="rating-select"
                aria-label={`Rating for ${book.title}`}
                value={book.rating ?? ""}
                onChange={(e) => onRate(book, e.target.value)}
              >
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    ★ {n}
                  </option>
                ))}
              </select>
            )}

            <button type="button" onClick={() => onToggleRead(book)}>
              {book.read ? "Mark unread" : "Mark read"}
            </button>
            <button type="button" onClick={() => onEdit(book)}>
              Edit
            </button>
            <button type="button" className="danger" onClick={() => onDelete(book)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default BookList;