import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Flex, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/home";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./store";
import PromptEditor from "./components/PromptEditor";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/prompts/new",
        element: <PromptEditor />,
      },
      {
        path: "/prompts/:id/edit",
        element: <PromptEditor />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Theme
        accentColor="violet"
        grayColor="mauve"
        radius="large"
        scaling="90%"
        panelBackground="translucent"
      >
        <Flex direction="column" gap="2" className="h-screen">
          <RouterProvider router={router} />
        </Flex>
      </Theme>
    </Provider>
  </StrictMode>,
);
