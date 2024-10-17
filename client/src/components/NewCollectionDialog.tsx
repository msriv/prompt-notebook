import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import { IconFolderPlus, IconPlus } from "@tabler/icons-react";

const NewCollectionDialog = () => {
  return (
    <Dialog.Root>
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
            <TextField.Root placeholder="Sample collection" />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button>Save</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default NewCollectionDialog;
