import {
  Dialog,
  Button,
  Flex,
  Text,
  ScrollArea,
  Separator,
} from "@radix-ui/themes";
import { IconPlus } from "@tabler/icons-react";
import {
  useGetCollectionsQuery,
  useAddPromptsToCollectionMutation,
} from "../store/api/collections";
import { useAppSelector } from "../store/hooks";
import { createContext, useContext, useState } from "react";
import NewCollectionDialog from "./NewCollectionDialog";

interface AddToCollectionDialogProps {
  promptId: string;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AddToCollectionContextType {
  promptId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleAddToCollection: (collectionId: string) => Promise<void>;
}

const AddToCollectionContext = createContext<AddToCollectionContextType | null>(
  null,
);

const useAddToCollection = () => {
  const context = useContext(AddToCollectionContext);
  if (!context) {
    throw new Error(
      "AddToCollection compound components must be used within AddToCollectionDialog",
    );
  }
  return context;
};

const AddToCollectionDialog: React.FC<AddToCollectionDialogProps> & {
  Trigger: React.FC<{ children: React.ReactNode }>;
  Content: React.FC;
} = ({ promptId, isOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [addToCollection] = useAddPromptsToCollectionMutation();

  const handleAddToCollection = async (collectionId: string) => {
    try {
      if (currentProjectId) {
        await addToCollection({
          collection_id: collectionId,
          prompt_ids: [promptId],
          project_id: currentProjectId,
        }).unwrap();
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to add prompt to collection:", error);
    }
  };

  return (
    <AddToCollectionContext.Provider
      value={{ promptId, open, setOpen, handleAddToCollection }}
    >
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        {children}
      </Dialog.Root>
    </AddToCollectionContext.Provider>
  );
};

const Trigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Dialog.Trigger>{children}</Dialog.Trigger>;
};

const Content: React.FC = () => {
  const { handleAddToCollection, setOpen } = useAddToCollection();
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );
  const { data: collections, isLoading } = useGetCollectionsQuery(
    {
      projectId: currentProjectId!,
    },
    { skip: !currentProjectId },
  );

  return (
    <Dialog.Content>
      <Dialog.Title>Add to Collection</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        Choose a collection to add this prompt to.
      </Dialog.Description>

      <ScrollArea type="auto" scrollbars="vertical" style={{ height: 300 }}>
        <Flex direction="column" gap="2">
          <NewCollectionDialog
            onCollectionCreated={(collectionId) => {
              handleAddToCollection(collectionId);
              setOpen(false);
            }}
          >
            <NewCollectionDialog.Trigger>
              <Button variant="soft" color="gray">
                <IconPlus size={16} />
                Create New Collection
              </Button>
            </NewCollectionDialog.Trigger>
            <NewCollectionDialog.Content />
          </NewCollectionDialog>

          <Separator size="4" />

          {isLoading ? (
            <Text>Loading collections...</Text>
          ) : collections?.length === 0 ? (
            <Text color="gray">No collections found</Text>
          ) : (
            collections?.map((collection) => (
              <Button
                key={collection.id}
                variant="soft"
                onClick={() => handleAddToCollection(collection.id)}
              >
                {collection.name}
              </Button>
            ))
          )}
        </Flex>
      </ScrollArea>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Close
          </Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  );
};

AddToCollectionDialog.Trigger = Trigger;
AddToCollectionDialog.Content = Content;

export default AddToCollectionDialog;
