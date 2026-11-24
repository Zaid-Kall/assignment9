import { useEffect, useState } from "react";
import { getStats } from "../api/books.js";

function StatsPanel({ refreshKey }) {
  const [state, setState] = useState({ data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();

    getStats(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, error: "" });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ data: null, error: err.message });
      });

    return () => controller.abort();
  }, [refreshKey]);

  if (state.error) {
    return <p className="message error">Stats error: {state.error}</p>;
  }

  if (!state.data) {
    return <p className="message">Loading statistics...</p>;
  }

  const { total, read, unread, averageRating, byGenre } = state.data;

  return (
    <section className="stats" aria-label="Statistics">
      <div className="stat">
        <strong>{total}</strong>
        <span>Total books</span>
      </div>
      <div className="stat">
        <strong>{read}</strong>
        <span>Read</span>
      </div>
      <div className="stat">
        <strong>{unread}</strong>
        <span>Unread</span>
      </div>
      <div className="stat">
        <strong>{averageRating ?? "-"}</strong>
        <span>Average rating</span>
      </div>
      <div className="genres">
        {Object.entries(byGenre).map(([genre, count]) => (
          <span key={genre} className="badge">
            {genre}: {count}
          </span>
        ))}
      </div>
    </section>
  );
}

export default StatsPanel;