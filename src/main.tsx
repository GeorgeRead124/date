import { createRoot } from "react-dom/client";
import App from "./App";

// Note: StrictMode is intentionally omitted here. This experience relies on
// precisely-timed setTimeout/setInterval sequences for cinematic narration;
// StrictMode's dev-only double-invocation of effects would double-fire them.
createRoot(document.getElementById("root")!).render(<App />);
