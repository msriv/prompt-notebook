import { Flex, Heading, Text, Button, Box } from "@radix-ui/themes";
import { IconNotebook } from "@tabler/icons-react";

export default function MyApp() {
  return (
    <Flex direction="column" justify="between" gap="2">
      <Flex
        direction="row"
        align="center"
        justify="between"
        gap="2"
        height={"100%"}
      >
        <Flex direction="row" gap="2">
          <IconNotebook />
          <Text>Prompt Notebook</Text>
        </Flex>
        <Button>Login</Button>
      </Flex>
      <Heading>Welcome to Prompt Notebook</Heading>
      <Text>This is a simple prompt management tool for your GenAI Apps</Text>
      <Box className=""></Box>
    </Flex>
  );
}
