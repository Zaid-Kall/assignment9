import { useEffect, useState } from "react";
import { getStats } from "../api.js";

function StatsPanel({ refreshKey }) {
  const [state, setState] = useState({ data: null, error: "" });

  useEffect(() => {
    let ignore = false;

    getStats()
      .then((data) => {
        if (!ignore) setState({ data, error: "" });
      })
      .catch((err) => {
        if (!ignore) setState({ data: null, error: err.message });
      });

    return () => {
      ignore = true;
    };
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