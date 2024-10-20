import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8000/v1/projects" }),
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: (project) => ({
        url: "/",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Project"],
    }),

    listProjects: builder.query({
      query: () => `/`,
      providesTags: ["Project"],
    }),

    getProject: builder.query({
      query: (projectId) => `/${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: "Project", id: projectId },
      ],
    }),

    updateProject: builder.mutation({
      query: ({ projectId, ...update }) => ({
        url: `/${projectId}`,
        method: "PUT",
        body: update,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
      ],
    }),

    deleteProject: builder.mutation({
      query: (projectId) => ({
        url: `/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useListProjectsQuery,
  useGetProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
