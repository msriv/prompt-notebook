import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  project_id: string;
}

interface CollectionWithPrompts extends Collection {
  prompts: {
    [key: string]: {
      id: string;
      version: number;
      content: string;
    };
  };
}

interface CollectionList {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  project_id: string;
}

interface CreateCollectionRequest {
  name: string;
  slug: string;
  description?: string;
  project_id: string;
}

interface UpdateCollectionRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export const collectionsApi = createApi({
  reducerPath: "collectionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8000/v1/collections",
  }),
  tagTypes: ["Collections"],
  endpoints: (builder) => ({
    getCollections: builder.query<CollectionList[], { projectId: string }>({
      query: ({ projectId }) => `/?project_id=${projectId}`,
      providesTags: ["Collections"],
    }),

    getCollection: builder.query<
      CollectionWithPrompts,
      { collection_id_or_slug: string; projectId: string }
    >({
      query: ({ collection_id_or_slug, projectId }) =>
        `/${collection_id_or_slug}?project_id=${projectId}`,
      providesTags: ["Collections"],
    }),

    createCollection: builder.mutation<Collection, CreateCollectionRequest>({
      query: (body) => ({
        url: `/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Collections"],
    }),

    updateCollection: builder.mutation<
      Collection,
      {
        collection_id: string;
        body: UpdateCollectionRequest;
        project_id: string;
      }
    >({
      query: ({ collection_id, body, project_id }) => ({
        url: `/${collection_id}?project_id=${project_id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Collections"],
    }),

    addPromptsToCollection: builder.mutation<
      { status: string },
      { collection_id: string; prompt_ids: string[]; project_id: string }
    >({
      query: ({ collection_id, prompt_ids, project_id }) => ({
        url: `/${collection_id}/prompts?project_id=${project_id}`,
        method: "POST",
        body: { prompt_ids },
      }),
      invalidatesTags: ["Collections"],
    }),

    removePromptsFromCollection: builder.mutation<
      { status: string },
      { collection_id: string; prompt_ids: string[]; project_id: string }
    >({
      query: ({ collection_id, prompt_ids, project_id }) => ({
        url: `/${collection_id}/prompts?project_id=${project_id}`,
        method: "DELETE",
        body: { prompt_ids },
      }),
      invalidatesTags: ["Collections"],
    }),

    deleteCollection: builder.mutation<
      { status: string },
      { collection_id: string; recursive?: boolean; project_id: string }
    >({
      query: ({ collection_id, recursive = false, project_id }) => ({
        url: `/${collection_id}?project_id=${project_id}&recursive=${recursive}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Collections"],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useAddPromptsToCollectionMutation,
  useRemovePromptsFromCollectionMutation,
  useDeleteCollectionMutation,
} = collectionsApi;
