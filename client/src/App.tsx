import { Flex, Select, Text } from "@radix-ui/themes";
import { IconNotebook, IconPlus } from "@tabler/icons-react";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  useListProjectsQuery,
  useCreateProjectMutation,
} from "./store/api/projects";
import CreateProjectDialog from "./components/CreateProjectDialog";
import { useAppDispatch } from "./store/hooks";
import { setCurrentProject } from "./store/slices/projects";

interface Project {
  id: string;
  name: string;
}

export default function App(): ReactElement {
  const navigate = useNavigate();
  const { data, isFetching, refetch } = useListProjectsQuery({});
  const [createProject] = useCreateProjectMutation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const dispatch = useAppDispatch();
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    if (data && data.length > 0) {
      dispatch(setCurrentProject(data[0].id));
      setSelectedProject(data[0].id);
    }
  }, [data, dispatch]);

  const handleCreateProject = async (
    name: string,
    slug: string,
    description: string,
  ) => {
    await createProject({ name, slug, description });
    setShowCreateDialog(false);
    refetch();
  };

  const handleProjectChange = useCallback(
    (value: string) => {
      if (value === "new") {
        setShowCreateDialog(true);
      } else {
        setSelectedProject(value);
        dispatch(setCurrentProject(value));
        navigate("/");
      }
    },
    [dispatch, navigate],
  );

  if (isFetching) return <div>Loading...</div>;

  if (!data || data.length === 0) {
    if (!showCreateDialog) {
      setShowCreateDialog(true);
    }
    return (
      <CreateProjectDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateProject={handleCreateProject}
      />
    );
  }

  return (
    <Flex
      direction="column"
      justify="between"
      gap="2"
      className="h-screen overflow-hidden"
    >
      <Flex
        direction="row"
        align="center"
        justify="between"
        gap="2"
        className="p-2"
      >
        <Flex direction="row" gap="2">
          <IconNotebook />
          <Text>Prompt Notebook</Text>
        </Flex>
        <Select.Root
          value={selectedProject}
          onValueChange={handleProjectChange}
        >
          <Select.Trigger placeholder="Select a project" />
          <Select.Content>
            {data.map((project: Project) => (
              <Select.Item key={project.id} value={project.id}>
                {project.name}
              </Select.Item>
            ))}
            <Select.Item value="new">
              <Flex align="center" gap="2">
                <IconPlus size={16} />
                Create New Project
              </Flex>
            </Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>
      <Flex
        direction="column"
        className="flex-grow min-h-0 overflow-hidden p-2"
      >
        <Outlet />
      </Flex>
      <CreateProjectDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateProject={handleCreateProject}
      />
    </Flex>
  );
}
