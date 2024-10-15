import { Flex, Text } from "@radix-ui/themes";
import { IconNotebook } from "@tabler/icons-react";
import { ReactElement } from "react";
import { Outlet } from "react-router-dom";

export default function App(): ReactElement {
  return (
    <Flex direction="column" justify="between" gap="2" className="p-2">
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
      </Flex>
      <Outlet />
    </Flex>
  );
}
