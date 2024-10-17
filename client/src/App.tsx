import { Flex, Text } from "@radix-ui/themes";
import { IconNotebook } from "@tabler/icons-react";
import { ReactElement } from "react";
import { Outlet } from "react-router-dom";

export default function App(): ReactElement {
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
      </Flex>
      <Flex
        direction="column"
        className="flex-grow min-h-0 overflow-hidden p-2"
      >
        <Outlet />
      </Flex>
    </Flex>
  );
}
