# Assignment 9 - Reading List

A small full-stack app for keeping a reading list. The project is a monorepo with two separate programs:

- `server/` - REST API built with Express 5 (ES modules) and the `cors` package. Data is kept in memory.
- `client/` - React app built with Vite. It talks to the API directly (no Vite proxy), so CORS is configured on the server.

## Features

- Full CRUD for books (`title`, `author`, `year`, `genre`, `read`, `rating`)
- Manual validation on the server (no validation library)
- Search, filter by genre and read status, sorting and paging
- Statistics endpoint (totals, average rating, books per genre)
- CORS restricted to the exact client origin
- Client with search, filters, sorting, pager, add/edit form, read toggle, rating, delete and a statistics panel

## Project structure

```
assignment9/
  server/
    server.js        routes, CORS, 404 and error handling
    booksStore.js    in-memory data and store functions
    validate.js      manual validation and duplicate check
    query.js         filtering, search, sorting, paging
    .env.example
  client/
    src/
      api.js         fetch wrapper for the API
      App.jsx        state, data loading, actions
      components/    BookControls, BookForm, BookList, StatsPanel
    .env.example
```

## Setup

Requirements: Node.js 20.6 or newer (the server uses `node --env-file-if-exists`).

### 1. Server

```
cd server
npm install
copy .env.example .env
npm run dev
```

`server/.env.example`:

```
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

The `.env` file is not committed. If it does not exist the server still starts with these defaults. Use `npm start` instead of `npm run dev` to run without file watching.

Note: data lives in memory, so restarting the server restores the seed books.

### 2. Client

```
cd client
npm install
copy .env.example .env
npm run dev
```

`client/.env.example`:

```
VITE_API_URL=http://localhost:3000
```

Open http://localhost:5173. The client calls the API at `VITE_API_URL` directly.

## API

| Method | Path | Description | Success |
| --- | --- | --- | --- |
| GET | `/api/books` | List books (supports query options below) | 200 |
| GET | `/api/books/:id` | Get one book | 200 |
| POST | `/api/books` | Create a book | 201 + `Location` header |
| PUT | `/api/books/:id` | Replace a book | 200 |
| PATCH | `/api/books/:id` | Update some fields | 200 |
| DELETE | `/api/books/:id` | Delete a book | 204, no body |
| GET | `/api/stats` | Totals, average rating, books per genre | 200 |

### Query options for `GET /api/books`

| Option | Values |
| --- | --- |
| `genre` | `fiction`, `non-fiction`, `science`, `history`, `fantasy`, `other` |
| `read` | `true` or `false` |
| `q` | text searched in title and author |
| `sort` | `title`, `author`, `year`, `rating` |
| `order` | `asc` or `desc` |
| `page` | page number |
| `limit` | integer from 1 to 50 |

The total number of matching books is returned in the `X-Total-Count` header.

### Status codes and errors

| Code | When |
| --- | --- |
| 200 | Successful read or update |
| 201 | Book created (`Location: /api/books/<id>`) |
| 204 | Book deleted |
| 400 | Invalid data, invalid query option, invalid id or malformed JSON |
| 404 | Unknown book id or unknown route |
| 409 | A book with the same title and author already exists |
| 413 | Request body too large |
| 500 | Unexpected server error |

Every error is JSON in the form `{ "error": "message" }`. Validation errors list all problems in one message, separated by `; `.

Validation rules include: title is 1 to 100 characters after trimming, year is an integer from 1000 to 2026, genre must be one of the allowed values. Author, read and rating are validated as well (see `server/validate.js`).

## CORS

The server only allows the exact origin from `CLIENT_ORIGIN` (default `http://localhost:5173`):

```js
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    exposedHeaders: ["X-Total-Count", "Location"],
  })
);
```

- `exposedHeaders` lets browser code read `X-Total-Count` and `Location`.
- The origin is a single exact string, not `*` and not a pattern.
- There is no Vite proxy in `client/vite.config.js`.

## Evidence: curl outputs

All commands were run in PowerShell against the running server. `curl.exe` is used because `curl` is an alias in PowerShell. Requests with a body read it from a file with `--data-binary "@file.json"`. Headers that are not relevant (`X-Powered-By`, `ETag`, `Date`, `Connection`, `Keep-Alive`) are left out of the outputs below. Everything else is exactly what the server returned.

### 1. List books with paging header (200)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?limit=2"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
X-Total-Count: 7
Content-Type: application/json; charset=utf-8

[{"id":1,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction","read":true,"rating":5},{"id":2,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":4}]
```

Only 2 books are returned because of `limit=2`, while `X-Total-Count` reports all 7.

### 2. Get one book (200)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books/1"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"id":1,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction","read":true,"rating":5}
```

### 3. Filter by genre and sort by year descending (200)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?genre=fantasy&sort=year&order=desc"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
X-Total-Count: 2
Content-Type: application/json; charset=utf-8

[{"id":5,"title":"The Name of the Wind","author":"Patrick Rothfuss","year":2007,"genre":"fantasy","read":false,"rating":null},{"id":2,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":4}]
```

### 4. Search by text (200)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?q=dune"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
X-Total-Count: 1
Content-Type: application/json; charset=utf-8

[{"id":1,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction","read":true,"rating":5}]
```

### 5. Statistics (200)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/stats"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"total":7,"read":4,"unread":3,"averageRating":4.5,"byGenre":{"fiction":2,"fantasy":2,"science":2,"history":1}}
```

### 6. Create a book (201 and Location)

Body file `good.json`:

```
{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":false,"rating":null}
```

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@good.json"
```

```
HTTP/1.1 201 Created
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Location: /api/books/8
Content-Type: application/json; charset=utf-8

{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":false,"rating":null,"id":8}
```

### 7. Create with invalid data (400)

Body file `bad.json`:

```
{"title":"","author":"Test Author","year":"abc","genre":"nonsense"}
```

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@bad.json"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"title must be 1 to 100 characters after trimming; year must be an integer between 1000 and 2026; genre must be one of: fiction, non-fiction, science, history, fantasy, other"}
```

All validation problems are reported together in a single response.

### 8. Create a duplicate (409)

Same `good.json` body sent again:

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@good.json"
```

```
HTTP/1.1 409 Conflict
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"A book with the same title and author already exists (id 8)"}
```

### 9. Malformed JSON body (400)

Body file `broken.json` contains `{"title": ` (incomplete JSON).

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@broken.json"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Request body is not valid JSON"}
```

### 10. Book that does not exist (404)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books/9999"
```

```
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Book 9999 not found"}
```

### 11. Invalid query option (400)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?limit=0"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"limit must be an integer between 1 and 50"}
```

### 12. Partial update with PATCH (200)

Body file `patch.json`:

```
{"read":true,"rating":4}
```

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X PATCH "http://localhost:3000/api/books/8" --data-binary "@patch.json"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":true,"rating":4,"id":8}
```

### 13. Full replace with PUT (200)

Body file `put.json`:

```
{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":true,"rating":5}
```

```
curl.exe -s -i -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X PUT "http://localhost:3000/api/books/8" --data-binary "@put.json"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":true,"rating":5,"id":8}
```

### 14. Delete (204, empty body)

```
curl.exe -s -i -H "Origin: http://localhost:5173" -X DELETE "http://localhost:3000/api/books/8"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
```

### 15. Delete the same book again (404)

```
curl.exe -s -i -H "Origin: http://localhost:5173" -X DELETE "http://localhost:3000/api/books/8"
```

```
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Book 8 not found"}
```

### 16. Unknown route (404 as JSON)

```
curl.exe -s -i -H "Origin: http://localhost:5173" "http://localhost:3000/api/nothing"
```

```
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Route GET /api/nothing not found"}
```

### 17. Preflight from the allowed origin

A browser sends this `OPTIONS` request before a cross-origin `DELETE`, `PUT`, `PATCH` or a request with a JSON `Content-Type`.

```
curl.exe -s -i -X OPTIONS "http://localhost:3000/api/books/1" -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: DELETE" -H "Access-Control-Request-Headers: content-type"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Length: 0
```

The response allows the origin, the requested method (`DELETE`) and the requested header (`content-type`), so the browser goes on to send the real request.

### 18. Preflight from a different origin

```
curl.exe -s -i -X OPTIONS "http://localhost:3000/api/books/1" -H "Origin: http://evil.example.com" -H "Access-Control-Request-Method: DELETE"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Length: 0
```

The server never echoes `http://evil.example.com`. It always answers with the one configured origin, `http://localhost:5173`. A browser page running on `http://evil.example.com` compares that value with its own origin, sees they are different, and blocks the response. curl does not enforce CORS, which is why the request itself still returns 204.