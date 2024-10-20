import { Dialog, Button, TextField, Flex, TextArea } from "@radix-ui/themes";
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
        <Dialog.Description>
          Create a new project to organize your prompts and start working on
          your ideas.
        </Dialog.Description>
        <Flex direction="column" gap="2">
          <TextField.Root
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <TextField.Root
            placeholder="Project slug"
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
          />
          <TextArea
            placeholder="Project description (optional)"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </Flex>
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default CreateProjectDialog;
