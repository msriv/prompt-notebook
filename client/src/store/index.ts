import { configureStore } from "@reduxjs/toolkit";
import { promptsAPI } from "./api/prompts";
import { projectsApi } from "./api/projects";
import projectReducer from "./slices/projects";

export const store = configureStore({
  reducer: {
    [promptsAPI.reducerPath]: promptsAPI.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      promptsAPI.middleware,
      projectsApi.middleware,
    ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
