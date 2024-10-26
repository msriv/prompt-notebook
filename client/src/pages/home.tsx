import { Box, Button, Text, Card, Flex, Dialog } from "@radix-ui/themes";
import { IconCirclePlus, IconPlus } from "@tabler/icons-react";
import PromptsList from "../components/PromptsList";
import NewCollectionDialog from "../components/NewCollectionDialog";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <Flex direction="column" gap="2">
      <Flex direction="row" gap="2">
        <Box maxWidth="350px">
          <Card
            asChild
            className="cursor-pointer"
            onClick={() => navigate("/prompts/new")}
          >
            <button>
              <Flex gap="3" align="center">
                <IconCirclePlus size={20} strokeWidth={1.5} />
                <Box>
                  <Text as="div" size="2" weight="bold">
                    New Prompt
                  </Text>
                  <Text as="div" color="gray" size="2">
                    Create a new prompt
                  </Text>
                </Box>
              </Flex>
            </button>
          </Card>
        </Box>

        <NewCollectionDialog>
          <NewCollectionDialog.DefaultTrigger />
          <NewCollectionDialog.Content />
        </NewCollectionDialog>
      </Flex>
      <PromptsList />
    </Flex>
  );
};

export default HomePage;
