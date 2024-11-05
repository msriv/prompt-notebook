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
    getTags: builder.query<
      Tag[],
      { promptId: string; version: number; projectId: string }
    >({
      query: ({ promptId, version, projectId }) =>
        `/${promptId}/versions/${version}/tags?project_id=${projectId}`,
      providesTags: ["Tags"],
    }),

    // Create a new tag for a prompt version
    createTag: builder.mutation<
      Tag,
      { promptId: string; version: number; tag: TagCreate; projectId: string }
    >({
      query: ({ promptId, version, tag, projectId }) => ({
        url: `/${promptId}/versions/${version}/tags?project_id=${projectId}`,
        method: "POST",
        body: tag,
      }),
      invalidatesTags: ["Tags"],
    }),

    // Delete a tag from a prompt version
    deleteTag: builder.mutation<
      { status: string },
      { promptId: string; version: number; tagId: string; projectId: string }
    >({
      query: ({ promptId, version, tagId, projectId }) => ({
        url: `/${promptId}/versions/${version}/tags/${tagId}?project_id=${projectId}`,
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
      { promptId: string; tagIdOrName: string; projectId: string }
    >({
      query: ({ promptId, tagIdOrName, projectId }) =>
        `/${promptId}/tags/${tagIdOrName}?project_id=${projectId}`,
    }),
  }),
});

export const {
  useGetTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetPromptByTagQuery,
} = tagsApi;
