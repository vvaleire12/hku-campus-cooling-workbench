import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { crest } from "./assets";
import "./styles.css";
document
  .querySelector<HTMLLinkElement>('link[rel="icon"]')
  ?.setAttribute("href", crest);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
