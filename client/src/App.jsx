import { useEffect, useState } from "react";
import { listBooks } from "./api.js";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    listBooks()
      .then(({ total }) => setStatus(`Connected: ${total} books on the server`))
      .catch((err) => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <main className="app">
      <h1>Reading List</h1>
      <p>{status}</p>
    </main>
  );
}

export default App;