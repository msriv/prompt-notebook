import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const promptsAPI = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000/v1/prompts" }),
  tagTypes: ["Prompts"],
  endpoints: (builder) => ({
    getPrompts: builder.query({
      query: ({ project_id }) => ({
        url: `/?project_id=${project_id}`,
      }),
      providesTags: ["Prompts"],
    }),
    createPrompt: builder.mutation({
      query: ({ project_id, body }) => ({
        url: "/?project_id=" + project_id,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Prompts"],
    }),
    getPrompt: builder.query({
      query: ({ promptId, projectId }) =>
        `/${promptId}?project_id=${projectId}`,
      providesTags: ["Prompts"],
    }),
    getPromptVersion: builder.query({
      query: ({ promptId, version, projectId }) =>
        `/${promptId}/versions/${version}?project_id=${projectId}`,
      providesTags: ["Prompts"],
    }),
    updatePrompt: builder.mutation<
      {},
      { promptId: string; projectId: string; body: any }
    >({
      query: ({ promptId, projectId, body }) => ({
        url: `/${promptId}?project_id=${projectId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Prompts"],
    }),
    deletePrompt: builder.mutation({
      query: ({ promptId, projectId }) => ({
        url: `/${promptId}?project_id=${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Prompts"],
    }),
  }),
});
