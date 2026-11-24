function BookList({ books, loading, error, filtered, onEdit, onRetry }) {
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
            {book.read && book.rating !== null && <span>★ {book.rating}/5</span>}
            <button type="button" onClick={() => onEdit(book)}>
              Edit
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default BookList;