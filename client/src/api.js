const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Is it running?");
  }

  if (response.status === 204) return { data: null, response };

  let data = null;
  try {
    data = await response.json();
  } catch {
    // response has no JSON body
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return { data, response };
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function listBooks(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  const { data, response } = await request(`/api/books${qs ? `?${qs}` : ""}`);
  const total = Number(response.headers.get("X-Total-Count") ?? data.length);
  return { items: data, total };
}

export async function getStats() {
  const { data } = await request("/api/stats");
  return data;
}

export async function createBook(book) {
  const { data } = await request("/api/books", jsonOptions("POST", book));
  return data;
}

export async function updateBook(id, changes) {
  const { data } = await request(`/api/books/${id}`, jsonOptions("PATCH", changes));
  return data;
}

export async function deleteBook(id) {
  await request(`/api/books/${id}`, { method: "DELETE" });
}