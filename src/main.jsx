import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./premium-refresh.css";
import "./logo-fix.css";
import "./luxury-final.css";
import "./final-interactions.css";
import "./premium-refresh.js";
import "./final-interactions.js";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
