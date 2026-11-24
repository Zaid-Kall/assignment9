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
- Every request is logged on the server (method and URL)
- Client with search, filters, sorting, pager, add/edit form, read toggle, rating, delete and a statistics panel

## File organization

```
assignment9/
  server/
    server.js        routes, request log, CORS, 404 fallback, error middleware
    booksStore.js    in-memory data (async functions, no in-place changes)
    validate.js      manual validation and duplicate check
    query.js         filtering, search, sorting, paging
    package.json
    package-lock.json
    .env.example
  client/
    src/
      api/books.js   the only place that calls fetch
      components/    BookControls, BookForm, BookList, StatsPanel
      App.jsx        state, data loading, actions
      constants.js   list of genres
      main.jsx
    .env.example
    index.html
    package.json
  .gitignore
  README.md
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

The `.env` file is not committed. If it does not exist the server still starts with these defaults. `npm run dev` restarts the server when a file changes (`node --watch`); `npm start` runs it once without watching.

Note: data lives in memory, so every restart restores the seed books.

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
| GET | `/api/books` | List books (supports the query options below) | 200 |
| GET | `/api/books/:id` | Get one book | 200 |
| POST | `/api/books` | Create a book from a complete body | 201 + `Location` header |
| PUT | `/api/books/:id` | Replace a book with a complete body | 200 |
| PATCH | `/api/books/:id` | Change only the fields sent | 200 |
| DELETE | `/api/books/:id` | Delete a book | 204, no body |
| GET | `/api/stats` | Totals, average rating, books per genre | 200 |
| GET | `/api/crash` | Deliberate crash (see below) | 500 |

### Book fields and validation

- `id`: integer, assigned by the server (an `id` in a request body is ignored)
- `title`, `author`: string, 1 to 100 characters after trimming
- `year`: integer from 1000 to the current year
- `genre`: `fiction`, `non-fiction`, `science`, `history`, `fantasy` or `other`
- `read`: boolean, default `false`
- `rating`: integer from 1 to 5 or `null` (default `null`), allowed only when `read` is `true`
- Two books cannot have the same title and author (compared case-insensitively): `409`
- For `PATCH` the merged book (existing values plus the changes) must pass the same validation as a complete book. Unknown fields are ignored.

### Query options for `GET /api/books`

| Option | Values |
| --- | --- |
| `genre` | one of the genres above |
| `read` | `true` or `false` |
| `q` | text searched (case-insensitive) in title and author |
| `sort` | `title`, `author`, `year`, `rating` (default: by id). Books without a rating always come last when sorting by rating. |
| `order` | `asc` (default) or `desc` |
| `limit` | page size, 1 to 50 (default 50) |
| `page` | page number (default 1) |

The total number of matching books is returned in the `X-Total-Count` header. An invalid value or a repeated parameter (`?genre=fiction&genre=history`) is a `400`.

### Status codes and errors

| Code | When |
| --- | --- |
| 200 | Successful read or update |
| 201 | Book created (`Location: /api/books/<id>`) |
| 204 | Book deleted (empty body) |
| 400 | Invalid data, invalid or repeated query option, invalid id or malformed JSON |
| 404 | Unknown book id, or a request that matches no route (`{ "error": "Not found" }`) |
| 409 | A book with the same title and author already exists |
| 413 | Request body too large |
| 500 | Unexpected error (`{ "error": "Something went wrong" }`, the details are only logged on the server) |

Every error is JSON in the form `{ "error": "message" }`. An id that is not a positive integer is a `400`; a valid id that does not exist is a `404`.

### The crash route

`GET /api/crash` is kept on purpose. Its handler is `async` and throws an error. In Express 5 a rejected promise from a handler goes to the error-handling middleware, which logs the error on the server and answers `500` with `{ "error": "Something went wrong" }` and no stack trace. Calling it returned exactly that body.

## CORS

The server only allows the exact origin from `CLIENT_ORIGIN` (default `http://localhost:5173`):

```js
app.use(cors({ origin: CLIENT_ORIGIN, exposedHeaders: ["X-Total-Count", "Location"] }));
```

- `exposedHeaders` lets browser code read `X-Total-Count` and `Location`.
- The origin is one exact string, not `*`.
- There is no Vite proxy in `client/vite.config.js`.

## Evidence: curl outputs

All commands were run in PowerShell against the running server. `curl.exe` is used because `curl` is an alias in PowerShell, and `--include` (`-i`) prints the status line and headers. Requests with a body read it from a file with `--data-binary "@file.json"`. Headers that do not matter here (`X-Powered-By`, `ETag`, `Date`, `Connection`, `Keep-Alive`, `Content-Length`) are left out. Everything else is exactly what the server returned. The outputs come from two runs of the server (it was restarted in between), which is why the id `8` appears twice.

### 1. List with a combination of query parameters (200)

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?genre=fantasy&sort=year&order=desc"
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

### 2. List with paging and the total count header (200)

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?limit=2"
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

### 3. One book (200)

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/books/1"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"id":1,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction","read":true,"rating":5}
```

### 4. Create a book (201 and Location)

Body file `good.json`:

```
{"title":"Script Test Book","author":"Test Author","year":2001,"genre":"science","read":false,"rating":null}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@good.json"
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

### 5. Create the same book again (409)

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@good.json"
```

```
HTTP/1.1 409 Conflict
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"A book with the same title and author already exists (id 8)"}
```

### 6. Invalid body (400)

Body file `bad.json`:

```
{"title":"","author":"Test Author","year":"abc","genre":"nonsense"}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@bad.json"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"title must be 1 to 100 characters after trimming; year must be an integer between 1000 and 2026; genre must be one of: fiction, non-fiction, science, history, fantasy, other"}
```

All validation problems are reported together in one response.

### 7. Malformed JSON body (400)

Body file `broken.json` contains `{"title": ` (incomplete JSON).

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@broken.json"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Request body is not valid JSON"}
```

### 8. Repeated query parameter (400)

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/books?genre=fiction&genre=history"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"genre must be a single value"}
```

### 9. Book that does not exist (404)

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/books/9999"
```

```
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Book 9999 not found"}
```

### 10. Delete (204) and the same delete again (404)

```
curl.exe --include -H "Origin: http://localhost:5173" -X DELETE "http://localhost:3000/api/books/8"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
```

The same command again:

```
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"Book 8 not found"}
```

### 11. Statistics, PATCH and PUT on one book (second run)

This run follows one new book from creation to deletion.

**a) Statistics before the change**

```
curl.exe --include -H "Origin: http://localhost:5173" "http://localhost:3000/api/stats"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"total":7,"read":4,"unread":3,"averageRating":4.5,"byGenre":{"fiction":2,"fantasy":2,"science":2,"history":1}}
```

**b) Create a book without `read` and `rating` (the defaults are applied)**

Body file `new.json`:

```
{"title":"Evidence Book","author":"Evidence Author","year":2024,"genre":"history"}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X POST "http://localhost:3000/api/books" --data-binary "@new.json"
```

```
HTTP/1.1 201 Created
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Location: /api/books/8
Content-Type: application/json; charset=utf-8

{"title":"Evidence Book","author":"Evidence Author","year":2024,"genre":"history","read":false,"rating":null,"id":8}
```

**c) Statistics after the change**

Same command as (a):

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"total":8,"read":4,"unread":4,"averageRating":4.5,"byGenre":{"fiction":2,"fantasy":2,"science":2,"history":2}}
```

The total went from 7 to 8, unread from 3 to 4 and history from 1 to 2. The numbers are computed from the current data on every request.

**d) PATCH with a partial body: only the fields sent change**

Body file `patch2.json`:

```
{"read":true,"rating":3}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X PATCH "http://localhost:3000/api/books/8" --data-binary "@patch2.json"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"title":"Evidence Book","author":"Evidence Author","year":2024,"genre":"history","read":true,"rating":3,"id":8}
```

**e) PUT with a partial body: rejected**

Body file `putpartial.json`:

```
{"rating":4}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X PUT "http://localhost:3000/api/books/8" --data-binary "@putpartial.json"
```

```
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"error":"title is required and must be a string; author is required and must be a string; year must be an integer between 1000 and 2026; genre must be one of: fiction, non-fiction, science, history, fantasy, other; rating is allowed only when read is true"}
```

**f) PUT with a complete body: replaces the book**

Body file `putfull.json`:

```
{"title":"Evidence Book","author":"Evidence Author","year":2024,"genre":"history","read":true,"rating":4}
```

```
curl.exe --include -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -X PUT "http://localhost:3000/api/books/8" --data-binary "@putfull.json"
```

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Type: application/json; charset=utf-8

{"title":"Evidence Book","author":"Evidence Author","year":2024,"genre":"history","read":true,"rating":4,"id":8}
```

The difference: `PATCH` accepts a few fields and keeps the rest of the book, while `PUT` is a replacement and needs every field, so the partial body of (e) fails.

**g) Delete the book, then statistics again**

```
curl.exe --include -H "Origin: http://localhost:5173" -X DELETE "http://localhost:3000/api/books/8"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Access-Control-Expose-Headers: X-Total-Count,Location
```

The statistics returned to their first values:

```
{"total":7,"read":4,"unread":3,"averageRating":4.5,"byGenre":{"fiction":2,"fantasy":2,"science":2,"history":1}}
```

### 12. Error handling: unknown route and crash route

- A request to `http://localhost:3000/api/nothing` answers `404` with the body `{"error":"Not found"}`.
- A request to `http://localhost:3000/api/crash` answers `500` with the body `{"error":"Something went wrong"}`. The real error with its stack trace appears only in the server terminal.

## Evidence: CORS preflight

A browser sends an `OPTIONS` preflight request before a cross-origin request that is not "simple" (for example `PUT`, `PATCH`, `DELETE`, or a body with `Content-Type: application/json`).

**In the browser.** I opened the Network tab of Chrome DevTools, clicked Edit on a book in the app and saved it. The `PUT` request (named `2`, status 200, type `fetch`) appeared, followed by the list and statistics requests. In this version of Chrome the `OPTIONS` request was not listed as a separate row, not even with the "All" filter or with the filter `method:OPTIONS` (the panel showed 0 of 3 requests). So I proved the preflight from the other side: the server logs every request, and its log for that single Save showed the preflight right before the real request, a few milliseconds apart:

```
2026-11-24T17:46:15.078Z OPTIONS /api/books/2
2026-11-24T17:46:15.082Z PUT /api/books/2
2026-11-24T17:46:15.217Z GET /api/stats
2026-11-24T17:46:15.219Z GET /api/books?page=1&limit=5
```

The `GET` requests made when the page loads have no `OPTIONS` before them, because a plain `GET` is a simple request.

**Preflight headers with curl.** The same request that the browser makes, sent by hand from the allowed origin:

```
curl.exe --include -X OPTIONS "http://localhost:3000/api/books/1" -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: DELETE" -H "Access-Control-Request-Headers: content-type"
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

The response allows the origin, the method (`DELETE`) and the header (`content-type`), so the browser goes on to send the real request.

From a different origin:

```
curl.exe --include -X OPTIONS "http://localhost:3000/api/books/1" -H "Origin: http://evil.example.com" -H "Access-Control-Request-Method: DELETE"
```

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Expose-Headers: X-Total-Count,Location
Content-Length: 0
```

The server never echoes `http://evil.example.com`. It always answers with the one configured origin, so a browser page running on another origin sees a mismatch and blocks the response.

## Reasoning questions

**1. Parameters. Why is the book's `id` a route parameter while `genre` and `sort` are query parameters? What would change if `id` were in the query string?**

The `id` names one specific resource, so it belongs in the path: `/api/books/3` is the address of that book, and `GET`, `PUT`, `PATCH` and `DELETE` all act on that address. `genre` and `sort` do not name anything. They are optional options that filter or arrange a collection and can be combined. If `id` were a query parameter (`/api/books?id=3`), the same route would have to behave as a list or as a single book depending on whether the parameter is present. A forgotten `id` could then turn a delete or a replace into an operation on the whole collection, and it would no longer be clear whether "not found" is a `404` or just an empty list.

**2. Body parsing. Experiment: move `express.json()` below the routes. What happened to `req.body`, and what status did a `POST` return?**

I moved `app.use(express.json())` below the routes and sent a valid `POST` with a correct JSON body. The server answered `400` with `{"error":"Request body must be a JSON object"}`. The JSON parser had not run yet when the request reached the route, so `req.body` was `undefined` (Express 5 only fills it when the parser middleware has run), and my validation rejected it. Middleware runs in the order it is registered, so the parser has to come before the routes that need the body.

**3. One response. Experiment: remove the `return` before an early `404` response in one handler. What happened and why?**

I removed `return` before the `404` in `GET /api/books/:id` and requested the book `9999`. The client still received the `404` JSON, but the server terminal printed an error with the code `ERR_HTTP_HEADERS_SENT`, logged by my error-handling middleware. Without `return` the function did not stop after sending the `404`; it went on and ran `res.json(book)` with `book` equal to `null`. A request can only get one response, so the second send threw. The user got the right answer by luck, but the code was broken.

**4. PUT and PATCH. Using your own API, explain a situation where `PATCH` is the better choice and one where `PUT` is.**

`PATCH` is the better choice for the "Mark read" button and the rating select in the app: they only change one or two fields (for example `{"read":true,"rating":3}`) and the rest of the book must stay as it is (evidence 11d). `PUT` fits the edit form, which holds the whole book and sends all the fields, so the stored book is replaced by exactly what the user sees. The same partial body that `PATCH` accepts is rejected by `PUT` with `400` (evidence 11e), because a replacement must be a complete valid book.

**5. CORS. Experiment: set `CLIENT_ORIGIN` to a wrong value. What did the browser console show, did the server log the request, and why does `curl` still work?**

I started the server with `CLIENT_ORIGIN=http://localhost:9999`. The console showed: "Access to fetch at 'http://localhost:3000/api/stats' from origin 'http://localhost:5173' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:9999' that is not equal to the supplied origin", followed by `net::ERR_FAILED 200 (OK)`, and the page showed "Cannot reach the server". The server did log the requests (`GET /api/books?page=1&limit=5`, `GET /api/stats`) and answered `200`; the browser simply refused to give the response to the page. `curl` still worked and returned the book `Dune`, because CORS is a rule enforced by the browser, not by the server. `curl` is not a browser and ignores the header.

**6. Validation. The client already checks the form. Why must the server validate again?**

The checks in the form are only a convenience for the user. Anyone can skip the page and send requests with `curl`, another program or the browser's developer tools, so the server can never assume that the data it receives came from my form. The server is the only place that I control and that protects the stored data, and some rules can only be checked there, such as the duplicate title and author. For example, evidence 6 sends invalid data without any form and the server rejects it with a clear message.

**7. State. Restart the server and describe what happened to the data. What does this tell you about where the data lives, and what is needed to keep it?**

I renamed `The Hobbit` to `The Hobbit2` with the edit form. After I restarted the server, the title was `The Hobbit` again and the list was the original seed (7 books, 4 read, 3 unread, average rating 4.5). The books are stored in a variable inside the server process (`booksStore.js`), so they exist only while that process runs and are lost when it stops. To keep data between restarts it must be saved outside the process, for example in a file or, better, in a database.

## Self-study notes

- **`URLSearchParams`.** In `client/src/api/books.js`, `listBooks` builds the query string with `new URLSearchParams()`. I read in the documentation that it encodes special characters by itself (a space or an `&` in a search text cannot break the URL) and that `toString()` gives the final string. I skip empty values so that the URL only contains the options that are really set.
- **`localeCompare`.** In `server/query.js`, strings are compared with `String(x).localeCompare(String(y), undefined, { sensitivity: "base" })`. The documentation explains that it compares text the way a person expects (alphabetical order, not by character code) and that the option `sensitivity: "base"` ignores case and accents. Numbers are compared by subtraction, and books without a rating are always placed last.
- **`import.meta.env` and `VITE_`.** Vite exposes environment variables to the browser code through `import.meta.env`, but only the ones whose name starts with `VITE_`; this prevents secrets of the `.env` file from ending up in the page by accident. The client reads `import.meta.env.VITE_API_URL` (with a default value) in `api/books.js`, and the dev server must be restarted after the value changes.
- **`204` in Express 5.** A `204` response must have no body, so the delete route uses `res.status(204).end()` instead of `res.json(...)`. Evidence 10 shows the response without a `Content-Type` and without a body. The client's request helper checks for status `204` before it tries to read JSON.
- **Cancelling `fetch` and `AbortError`.** Each data-loading effect in `App.jsx` and `StatsPanel.jsx` creates an `AbortController` and passes `controller.signal` to `fetch`; the effect cleanup calls `controller.abort()`. An aborted `fetch` rejects with an error whose `name` is `"AbortError"`. This is not a real failure, so the request helper rethrows it unchanged and the components ignore it, which means an old response can never overwrite a newer one.

## Challenges

- **The server restarted by itself.** With `npm run dev` (`node --watch`) the server restarted during my first curl run, because the project is inside a OneDrive folder and file changes in `node_modules` triggered the watcher. The restart emptied the in-memory data and cut some requests. I used `npm start` for the evidence runs, which also taught me how fragile in-memory data is.
- **No `OPTIONS` row in Chrome's Network tab.** I could not show the preflight request there. I added a small middleware that logs every request on the server, and its log shows the `OPTIONS` request before the `PUT`.
- **Stale responses in the client.** When the user types in the search box, an old, slower response could replace a newer one. I solved it with a request key and an `AbortController` per request.
- **Writing curl commands in PowerShell.** `curl` is an alias there, and quotes inside JSON are easily broken. I used `curl.exe`, quoted every URL that contains `&`, and sent bodies from files with `--data-binary`.
- **Keeping the stored data immutable.** Every change in `booksStore.js` builds a new array or object (`map`, `filter`, spread), and the client does the same with its state, so nothing is ever changed in place.