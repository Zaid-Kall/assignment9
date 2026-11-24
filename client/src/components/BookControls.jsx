import { GENRES } from "../constants.js";

function BookControls({ filters, onChange, onReset }) {
  return (
    <section className="controls">
      <input
        type="search"
        placeholder="Search title or author"
        aria-label="Search"
        value={filters.q}
        onChange={(e) => onChange({ q: e.target.value })}
      />

      <select
        aria-label="Genre"
        value={filters.genre}
        onChange={(e) => onChange({ genre: e.target.value })}
      >
        <option value="">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        aria-label="Read status"
        value={filters.read}
        onChange={(e) => onChange({ read: e.target.value })}
      >
        <option value="">All books</option>
        <option value="true">Read</option>
        <option value="false">Unread</option>
      </select>

      <select
        aria-label="Sort by"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value })}
      >
        <option value="">No sorting</option>
        <option value="title">Title</option>
        <option value="author">Author</option>
        <option value="year">Year</option>
        <option value="rating">Rating</option>
      </select>

      <select
        aria-label="Sort order"
        value={filters.order}
        disabled={!filters.sort}
        onChange={(e) => onChange({ order: e.target.value })}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      <button type="button" onClick={onReset}>
        Reset
      </button>
    </section>
  );
}

export default BookControls;