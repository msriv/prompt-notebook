import { Flex, Text, Button, Dialog } from "@radix-ui/themes";
import { IconPlayerPlay } from "@tabler/icons-react";
import TestPromptDialog from "./TestPromptDialog";
import { useState, useCallback, useMemo } from "react";

interface TestPromptProps {
  promptContent: string;
  promptFormat: string;
}

const TestPrompt: React.FC<TestPromptProps> = ({
  promptContent,
  promptFormat,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const extractVariables = useCallback((content: string, format: string) => {
    let regex: RegExp;
    if (format === "jinja2") {
      regex = /\{\{\s*(\w+)\s*\}\}/g;
    } else if (format === "f-string") {
      regex = /\{(\w+)\}/g;
    } else {
      return {};
    }

    const matches = content.matchAll(regex);
    const extractedVariables: { [key: string]: string } = {};

    for (const match of matches) {
      const variableName = match[1];
      if (!extractedVariables[variableName]) {
        extractedVariables[variableName] = "";
      }
    }

    return extractedVariables;
  }, []);

  const initialVariables = useMemo(() => {
    return extractVariables(promptContent, promptFormat);
  }, [promptContent, promptFormat, extractVariables]);

  const handleRunTest = (variables: { [key: string]: string }) => {
    console.log("Running test with variables:", variables);
    // Add your test logic here
  };

  return (
    <Flex
      direction="column"
      gap="2"
      style={{ borderRadius: "var(--radius-3)" }}
      className="border border-gray-200 p-4"
    >
      <Flex direction="row" gap="2" justify={"between"} align={"center"}>
        <Text size="4" weight="bold">
          Test Prompt
        </Text>
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger>
            <Button variant="soft">
              <IconPlayerPlay size={16} strokeWidth={1.5} />
            </Button>
          </Dialog.Trigger>
          <TestPromptDialog
            initialVariables={initialVariables}
            promptContent={promptContent}
            promptFormat={promptFormat}
            onRunTest={handleRunTest}
          />
        </Dialog.Root>
      </Flex>
    </Flex>
  );
};

export default TestPrompt;
