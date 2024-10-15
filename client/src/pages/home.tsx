import { Box, Button, Text, Card, Flex } from "@radix-ui/themes";
import { IconPlus } from "@tabler/icons-react";
import PromptsList from "../components/PromptsList";

const HomePage = () => {
  return (
    <Flex direction="column" gap="2" className="w-8/12 mx-auto">
      <Flex direction="row" gap="2">
        <Box maxWidth="240px">
          <Card>
            <Flex gap="3" align="center">
              <IconPlus />
              <Box>
                <Text as="div" size="2" weight="bold">
                  New Prompt
                </Text>
                <Text as="div" size="2" color="gray">
                  Create a new prompt
                </Text>
              </Box>
            </Flex>
          </Card>
        </Box>
        <Box maxWidth="350px">
          <Card>
            <Flex gap="3" align="center">
              <IconPlus />
              <Box>
                <Text as="div" size="2" weight="bold">
                  New Collection
                </Text>
                <Text as="div" size="2" color="gray">
                  Create a new collection for your prompts
                </Text>
              </Box>
            </Flex>
          </Card>
        </Box>
      </Flex>
      <PromptsList />
    </Flex>
  );
};

export default HomePage;
