import {
  Dialog,
  Button,
  TextField,
  Flex,
  TextArea,
  Text,
} from "@radix-ui/themes";
import { useState } from "react";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, slug: string, description: string) => void;
}

const CreateProjectDialog = ({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectDialogProps) => {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Format slug: convert to lowercase and replace whitespace with hyphens
  const formatSlug = (value: string): string => {
    return value.toLowerCase().replace(/\s+/g, "-");
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setProjectName(newName);
    setProjectSlug(formatSlug(newName));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectSlug(formatSlug(e.target.value));
  };

  const handleCreateProject = () => {
    if (projectName.trim() && projectSlug.trim()) {
      onCreateProject(
        projectName.trim(),
        projectSlug.trim(),
        projectDescription.trim(),
      );
      setProjectName("");
      setProjectSlug("");
      setProjectDescription("");
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Title>Create New Project</Dialog.Title>
        <Dialog.Description mb="4">
          Create a new project to organize your prompts and start working on
          your ideas.
        </Dialog.Description>
        <Flex direction="column" gap="3">
          <div>
            <Text as="label" size="2" mb="1">
              Project Name
            </Text>
            <TextField.Root
              placeholder="Enter project name"
              value={projectName}
              onChange={handleProjectNameChange}
            />
          </div>

          <div>
            <Text as="label" size="2" mb="1">
              Project Slug
            </Text>
            <TextField.Root
              placeholder="project-slug"
              value={projectSlug}
              onChange={handleSlugChange}
            />
          </div>

          <div>
            <Text as="label" size="2" mb="1">
              Description
            </Text>
            <TextArea
              placeholder="Enter project description (optional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </div>
        </Flex>
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || !projectSlug.trim()}
            >
              Create Project
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default CreateProjectDialog;
