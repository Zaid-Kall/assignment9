import { GENRES } from "./booksStore.js";

const FIELDS = ["title", "author", "year", "genre", "read", "rating"];

// A valid id is a positive integer written with digits only
export function parseId(raw) {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Keeps only the known fields: the id and unknown fields are ignored
export function pickFields(input) {
  const picked = {};
  for (const field of FIELDS) {
    if (input[field] !== undefined) picked[field] = input[field];
  }
  return picked;
}

// Validates a COMPLETE book (used by POST, PUT and by the merged book of PATCH)
export function validateBook(input) {
  if (!isPlainObject(input)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const data = pickFields(input);
  const errors = [];

  const checkText = (field) => {
    if (typeof data[field] !== "string") {
      errors.push(`${field} is required and must be a string`);
      return "";
    }
    const trimmed = data[field].trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      errors.push(`${field} must be 1 to 100 characters after trimming`);
    }
    return trimmed;
  };

  const title = checkText("title");
  const author = checkText("author");

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(data.year) || data.year < 1000 || data.year > currentYear) {
    errors.push(`year must be an integer between 1000 and ${currentYear}`);
  }

  if (!GENRES.includes(data.genre)) {
    errors.push(`genre must be one of: ${GENRES.join(", ")}`);
  }

  const read = data.read === undefined ? false : data.read;
  if (typeof read !== "boolean") {
    errors.push("read must be true or false");
  }

  const rating = data.rating === undefined ? null : data.rating;
  if (rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push("rating must be an integer from 1 to 5, or null");
    } else if (read !== true) {
      errors.push("rating is allowed only when read is true");
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: errors.join("; ") };
  }

  return {
    ok: true,
    value: { title, author, year: data.year, genre: data.genre, read, rating },
  };
}

// PATCH: existing values + the changes, then the MERGED book is validated
export function validateMerged(existing, changes) {
  if (!isPlainObject(changes)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  return validateBook({ ...existing, ...pickFields(changes) });
}

const normalize = (text) => text.trim().toLowerCase();

// Same title AND same author, compared case-insensitively
export function findDuplicate(candidate, books, ignoreId = null) {
  return (
    books.find(
      (book) =>
        book.id !== ignoreId &&
        normalize(book.title) === normalize(candidate.title) &&
        normalize(book.author) === normalize(candidate.author)
    ) ?? null
  );
}