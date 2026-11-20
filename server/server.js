import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// CORS: only the exact origin of the client is allowed
app.use(cors({ origin: CLIENT_ORIGIN }));

// Body parsing: registered BEFORE the routes
app.use(express.json());

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});