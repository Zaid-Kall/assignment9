const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Shared helper: sets Content-Type only when there is a body, checks response.ok,
// turns the server's { error } into an Error and handles the 204 case.
async function request(path, { method = "GET", body, signal } = {}) {
  const options = { method, signal };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (err) {
    // A cancelled request is not a network failure: let the caller recognise it
    if (err.name === "AbortError") throw err;
    throw new Error("Cannot reach the server. Is it running?");
  }

  if (response.status === 204) return { data: null, response };

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // otherwise the response has no JSON body
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return { data, response };
}

export async function listBooks(params = {}, signal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  const { data, response } = await request(`/api/books${qs ? `?${qs}` : ""}`, { signal });
  const total = Number(response.headers.get("X-Total-Count") ?? data.length);
  return { items: data, total };
}

export async function getStats(signal) {
  const { data } = await request("/api/stats", { signal });
  return data;
}

export async function createBook(book) {
  const { data } = await request("/api/books", { method: "POST", body: book });
  return data;
}

// PUT: replaces the whole book (used by the edit form)
export async function replaceBook(id, book) {
  const { data } = await request(`/api/books/${id}`, { method: "PUT", body: book });
  return data;
}

// PATCH: changes only the fields sent (used by the read toggle and the rating)
export async function updateBook(id, changes) {
  const { data } = await request(`/api/books/${id}`, { method: "PATCH", body: changes });
  return data;
}

export async function deleteBook(id) {
  await request(`/api/books/${id}`, { method: "DELETE" });
}