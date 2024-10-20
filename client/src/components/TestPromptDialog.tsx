import React, { useEffect, useState } from "react";
import {
  Dialog,
  Flex,
  Button,
  SegmentedControl,
  TextArea,
  Text,
} from "@radix-ui/themes";
import VariablesTable from "./VariablesTable";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

interface TestPromptDialogProps {
  initialVariables: { [key: string]: string };
  promptContent: string;
  promptFormat: string;
  onRunTest: (variables: { [key: string]: string }) => void;
}

const TestPromptDialog: React.FC<TestPromptDialogProps> = ({
  initialVariables,
  promptContent,
  promptFormat,
  onRunTest,
}) => {
  const [variablesView, setVariablesView] = useState("table");
  const [variables, setVariables] = useState(initialVariables);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    setVariables(initialVariables);
  }, [initialVariables]);

  const handleVariableUpdate = (name: string, value: string) => {
    setVariables((prev) => ({ ...prev, [name]: value }));
  };

  const handleJsonUpdate = (newJson: string) => {
    try {
      const parsedVariables = JSON.parse(newJson);
      setVariables(parsedVariables);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleRunTest = () => {
    onRunTest(variables);
  };

  return (
    <Dialog.Content style={{ maxWidth: 600 }}>
      <Dialog.Title>Test Prompt</Dialog.Title>
      <Flex direction="column" gap="2">
        <Text size="3" weight="bold">
          Prompt
        </Text>
        <TextArea placeholder="Prompt Content" value={promptContent} readOnly />
        <Text size="3" weight="bold">
          Variables
        </Text>
        <SegmentedControl.Root
          value={variablesView}
          onValueChange={setVariablesView}
          size={"1"}
        >
          <SegmentedControl.Item value="table">
            Table View
          </SegmentedControl.Item>
          <SegmentedControl.Item value="json">JSON Input</SegmentedControl.Item>
        </SegmentedControl.Root>
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
                onChange={handleJsonUpdate}
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
        <Text size="3" weight="bold">
          User Input
        </Text>
        <TextArea
          placeholder="User Input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </Flex>
      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close>
          <Button variant="soft" color="gray">
            Cancel
          </Button>
        </Dialog.Close>
        <Dialog.Close>
          <Button onClick={handleRunTest}>Run Test</Button>
        </Dialog.Close>
      </Flex>
    </Dialog.Content>
  );
};

export default TestPromptDialog;
