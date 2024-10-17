import { Flex, Text, Button, SegmentedControl } from "@radix-ui/themes";
import { IconPlayerPlay } from "@tabler/icons-react";
import VariablesTable from "./VariablesTable";
import CodeMirror from "@uiw/react-codemirror";

import { json } from "@codemirror/lang-json";
import { useCallback, useState } from "react";

const TestPrompt = () => {
  const [variablesView, setVariablesView] = useState("table");
  const [variables, setVariables] = useState<{ [key: string]: string }>({});

  const handleVariablesChange = (newVariables: string) => {
    try {
      const parsedVariables = JSON.parse(newVariables);
      setVariables(parsedVariables);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleVariableUpdate = (name: string, value: string) => {
    setVariables((prevVariables) => ({
      ...prevVariables,
      [name]: value,
    }));
  };

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
        <Button variant="soft">
          <IconPlayerPlay size={16} strokeWidth={1.5} />
        </Button>
      </Flex>
      <Flex>
        <SegmentedControl.Root
          defaultValue="table"
          size="1"
          onValueChange={setVariablesView}
        >
          <SegmentedControl.Item value="table">
            Table View
          </SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON Input</SegmentedControl.Item>
        </SegmentedControl.Root>
      </Flex>
      <Flex direction="column" className="flex-grow min-h-0 overflow-hidden">
        {variablesView === "table" ? (
          <VariablesTable
            variables={variables}
            onUpdate={handleVariableUpdate}
          />
        ) : (
          <div className="h-full overflow-auto">
            <CodeMirror
              value={JSON.stringify(variables, null, 2)}
              onChange={handleVariablesChange}
              extensions={[json()]}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: false,
              }}
              style={{
                fontSize: 12,
                height: "100%",
              }}
            />
          </div>
        )}
      </Flex>
    </Flex>
  );
};

export default TestPrompt;
