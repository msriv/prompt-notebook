import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Tag {
  id: string;
  name: string;
}

interface TagCreate {
  name: string;
}

export const tagsApi = createApi({
  reducerPath: "tagsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000/v1/prompts" }),
  tagTypes: ["Tags"],
  endpoints: (builder) => ({
    // Get all tags for a specific prompt version
    getTags: builder.query<Tag[], { promptId: string; version: number }>({
      query: ({ promptId, version }) => `/${promptId}/versions/${version}/tags`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Tags" as const, id })),
              { type: "Tags", id: "LIST" },
            ]
          : [{ type: "Tags", id: "LIST" }],
    }),

    // Create a new tag for a prompt version
    createTag: builder.mutation<
      Tag,
      { promptId: string; version: number; tag: TagCreate }
    >({
      query: ({ promptId, version, tag }) => ({
        url: `/${promptId}/versions/${version}/tags`,
        method: "POST",
        body: tag,
      }),
      invalidatesTags: [{ type: "Tags", id: "LIST" }],
    }),

    // Delete a tag from a prompt version
    deleteTag: builder.mutation<
      { status: string },
      { promptId: string; version: number; tagId: string }
    >({
      query: ({ promptId, version, tagId }) => ({
        url: `/${promptId}/versions/${version}/tags/${tagId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Tags", id: "LIST" }],
    }),

    // Get prompt version by tag name or ID
    getPromptByTag: builder.query<
      {
        id: string;
        version: number;
        content: string;
        created_at: string;
      },
      { promptId: string; tagIdOrName: string }
    >({
      query: ({ promptId, tagIdOrName }) => `/${promptId}/tags/${tagIdOrName}`,
    }),
  }),
});

export const {
  useGetTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetPromptByTagQuery,
} = tagsApi;
