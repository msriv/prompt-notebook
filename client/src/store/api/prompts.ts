import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const promptsAPI = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000/v1/prompts" }),
  tagTypes: ["Prompts"],
  endpoints: (builder) => ({
    getPrompts: builder.query({
      query: () => ({
        url: `/`,
      }),
      providesTags: ["Prompts"],
    }),
    createPrompt: builder.mutation({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Prompts"],
    }),
    getPrompt: builder.query({
      query: (promptId) => `/${promptId}`,
      providesTags: ["Prompts"],
    }),
    updatePrompt: builder.mutation<{}, { promptId: string; body: any }>({
      query: ({ promptId, body }) => ({
        url: `/${promptId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Prompts"],
    }),
    deletePrompt: builder.mutation({
      query: (promptId) => ({
        url: `/prompts/${promptId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Prompts"],
    }),
  }),
});
