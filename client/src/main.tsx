import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme
      accentColor="violet"
      grayColor="mauve"
      radius="large"
      scaling="100%"
      panelBackground="translucent"
    >
      <App />
    </Theme>
  </StrictMode>,
);
