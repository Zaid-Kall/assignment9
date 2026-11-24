import { GENRES } from "./booksStore.js";

const SORT_FIELDS = ["title", "author", "year", "rating"];

export function applyQuery(books, query) {
  const errors = [];

  const text = (name) => {
    const value = query[name];
    if (value === undefined) return undefined;
    if (typeof value !== "string") {
      errors.push(`${name} must be a single value`);
      return undefined;
    }
    return value.trim() || undefined;
  };

  const integer = (name, min, max) => {
    const value = text(name);
    if (value === undefined) return undefined;
    const n = Number(value);
    if (!/^\d+$/.test(value) || n < min || n > max) {
      errors.push(`${name} must be an integer between ${min} and ${max}`);
      return undefined;
    }
    return n;
  };

  const genre = text("genre");
  const read = text("read");
  const q = text("q");
  const sort = text("sort");
  const order = text("order");
  const page = integer("page", 1, 100000);
  const limit = integer("limit", 1, 50);

  if (genre !== undefined && !GENRES.includes(genre)) {
    errors.push(`genre must be one of: ${GENRES.join(", ")}`);
  }
  if (read !== undefined && read !== "true" && read !== "false") {
    errors.push("read must be true or false");
  }
  if (sort !== undefined && !SORT_FIELDS.includes(sort)) {
    errors.push(`sort must be one of: ${SORT_FIELDS.join(", ")}`);
  }
  if (order !== undefined && order !== "asc" && order !== "desc") {
    errors.push("order must be asc or desc");
  }

  if (errors.length > 0) return { ok: false, error: errors.join("; ") };

  let items = [...books];

  if (genre !== undefined) {
    items = items.filter((b) => b.genre === genre);
  }
  if (read !== undefined) {
    items = items.filter((b) => b.read === (read === "true"));
  }
  if (q !== undefined) {
    const needle = q.toLowerCase();
    items = items.filter(
      (b) => b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle)
    );
  }

  if (sort !== undefined) {
    const direction = order === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const x = a[sort];
      const y = b[sort];
      const xEmpty = x === null || x === undefined;
      const yEmpty = y === null || y === undefined;
      if (xEmpty) return yEmpty ? 0 : 1;
      if (yEmpty) return -1;
      const result =
        typeof x === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { sensitivity: "base" });
      return result * direction;
    });
  }

  const total = items.length;

  // Page size defaults to 50, page defaults to 1
  const size = limit ?? 50;
  const start = ((page ?? 1) - 1) * size;
  items = items.slice(start, start + size);

  return { ok: true, items, total };
}