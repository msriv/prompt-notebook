import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Text,
  TextField,
  TextArea,
} from "@radix-ui/themes";
import { IconFolderPlus } from "@tabler/icons-react";
import { useState, createContext, useContext, ReactNode } from "react";
import { useCreateCollectionMutation } from "../store/api/collections";
import { useAppSelector } from "../store/hooks";

interface NewCollectionContextType {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated?: (collectionId: string) => void;
}

const NewCollectionContext = createContext<
  NewCollectionContextType | undefined
>(undefined);

interface NewCollectionDialogProps {
  children: ReactNode;
  onCollectionCreated?: (collectionId: string) => void;
}

const NewCollectionDialog = ({
  children,
  onCollectionCreated,
}: NewCollectionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NewCollectionContext.Provider
      value={{
        isOpen,
        onOpenChange: setIsOpen,
        onCollectionCreated,
      }}
    >
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Dialog.Root>
    </NewCollectionContext.Provider>
  );
};

const Trigger = ({ children }: { children: ReactNode }) => {
  return <Dialog.Trigger>{children}</Dialog.Trigger>;
};

const DefaultTrigger = () => {
  return (
    <Dialog.Trigger>
      <Box maxWidth="350px">
        <Card asChild className="cursor-pointer">
          <button>
            <Flex gap="3" align="center">
              <IconFolderPlus size={20} strokeWidth={1.5} />
              <Box>
                <Text as="div" size="2" weight="bold">
                  New Collection
                </Text>
                <Text as="div" color="gray" size="2">
                  Create a new collection for your prompts
                </Text>
              </Box>
            </Flex>
          </button>
        </Card>
      </Box>
    </Dialog.Trigger>
  );
};

const Content = () => {
  const context = useContext(NewCollectionContext);
  if (!context) {
    throw new Error("Content must be used within NewCollectionDialog");
  }

  const { onOpenChange, onCollectionCreated } = context;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [createCollection, { isLoading }] = useCreateCollectionMutation();
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );

  const handleCreateCollection = async () => {
    if (!currentProjectId || !name.trim() || !slug.trim()) return;

    try {
      const response = await createCollection({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        project_id: currentProjectId,
      }).unwrap();

      // Reset and close...
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  return (
    <Dialog.Content maxWidth="450px">
      <Dialog.Title>Create Collection</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        Collections are used to group prompts together.
      </Dialog.Description>

      <Flex direction="column" gap="3">
        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Collection name
          </Text>
          <TextField.Root
            placeholder="Sample collection"
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              setSlug(newName.toLowerCase().replace(/[\s_]+/g, "-"));
            }}
          />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Slug
          </Text>
          <TextField.Root
            placeholder="sample-collection"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[\s_]+/g, "-"))
            }
          />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Description
          </Text>
          <TextArea
            placeholder="Add a description for your collection"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </Flex>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button
            variant="soft"
            color="gray"
            onClick={() => {
              setName("");
              setSlug("");
              setDescription("");
            }}
          >
            Cancel
          </Button>
        </Dialog.Close>
        <Button
          onClick={handleCreateCollection}
          disabled={!name.trim() || !slug.trim() || isLoading}
          loading={isLoading}
        >
          Create Collection
        </Button>
      </Flex>
    </Dialog.Content>
  );
};

// Attach components to NewCollectionDialog
NewCollectionDialog.Trigger = Trigger;
NewCollectionDialog.DefaultTrigger = DefaultTrigger;
NewCollectionDialog.Content = Content;

export default NewCollectionDialog;
