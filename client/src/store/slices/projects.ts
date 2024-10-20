import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProjectState {
  currentProjectId: string | null;
}

const initialState: ProjectState = {
  currentProjectId: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<string>) => {
      state.currentProjectId = action.payload;
    },
  },
});

export const { setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
