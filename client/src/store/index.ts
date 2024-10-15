import { configureStore } from "@reduxjs/toolkit";
import { promptsAPI } from "./api/prompts";

export const store = configureStore({
  reducer: {
    [promptsAPI.reducerPath]: promptsAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([promptsAPI.middleware]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
