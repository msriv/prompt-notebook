import { Button, Flex } from "@radix-ui/themes";
import { IconPlus } from "@tabler/icons-react";
import PromptsList from "../components/PromptsList";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <Flex direction="column" gap="2" className="w-9/12 mx-auto">
      <Flex direction="row" gap="2" align="center">
        <Button onClick={() => navigate("/prompts/new")}>
          <IconPlus strokeWidth={1.5} size={20} />
          New Prompt
        </Button>
      </Flex>
      <PromptsList />
    </Flex>
  );
};

export default HomePage;
