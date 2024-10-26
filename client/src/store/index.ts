import { configureStore } from "@reduxjs/toolkit";
import { promptsAPI } from "./api/prompts";
import { projectsApi } from "./api/projects";
import projectReducer from "./slices/projects";
import { tagsApi } from "./api/tags";
import { collectionsApi } from "./api/collections";

export const store = configureStore({
  reducer: {
    [promptsAPI.reducerPath]: promptsAPI.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [collectionsApi.reducerPath]: collectionsApi.reducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      promptsAPI.middleware,
      projectsApi.middleware,
      tagsApi.middleware,
      collectionsApi.middleware,
    ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
