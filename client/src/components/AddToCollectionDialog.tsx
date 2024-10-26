import {
  Dialog,
  Button,
  Flex,
  Text,
  ScrollArea,
  Separator,
} from "@radix-ui/themes";
import { IconFolderPlus, IconPlus } from "@tabler/icons-react";
import {
  useGetCollectionsQuery,
  useAddPromptsToCollectionMutation,
} from "../store/api/collections";
import { useAppSelector } from "../store/hooks";
import { useState } from "react";
import NewCollectionDialog from "./NewCollectionDialog";

interface AddToCollectionDialogProps {
  promptId: string;
}

const AddToCollectionDialog: React.FC<AddToCollectionDialogProps> = ({
  promptId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );
  const { data: collections, isLoading } = useGetCollectionsQuery(
    {
      project_id: currentProjectId!,
    },
    { skip: !currentProjectId },
  );
  const [addToCollection] = useAddPromptsToCollectionMutation();

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await addToCollection({
        collection_id: collectionId,
        prompt_ids: [promptId],
      }).unwrap();
      setIsOpen(false); // Close dialog after successful addition
    } catch (error) {
      console.error("Failed to add prompt to collection:", error);
    }
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger>
          <Button variant="soft" size="2">
            <IconFolderPlus size={16} />
            Add to Collection
          </Button>
        </Dialog.Trigger>

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
                  setIsOpen(false);
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
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default AddToCollectionDialog;
