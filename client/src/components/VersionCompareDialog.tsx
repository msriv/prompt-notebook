import { Button, Dialog, Flex, Select } from "@radix-ui/themes";
import { useState, createContext, useContext } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { promptsAPI } from "../store/api/prompts";
import { useAppSelector } from "../store/hooks";

interface VersionCompareDialogProps {
  promptId: string;
  versions: number[];
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface VersionCompareContextType {
  promptId: string;
  versions: number[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

const VersionCompareContext = createContext<VersionCompareContextType | null>(
  null,
);

const useVersionCompare = () => {
  const context = useContext(VersionCompareContext);
  if (!context) {
    throw new Error(
      "VersionCompare compound components must be used within VersionCompareDialog",
    );
  }
  return context;
};

const VersionCompareDialog: React.FC<VersionCompareDialogProps> & {
  Trigger: React.FC<{ children: React.ReactNode }>;
  Content: React.FC;
} = ({ promptId, versions, children, isOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <VersionCompareContext.Provider
      value={{ promptId, versions, open, setOpen }}
    >
      <Dialog.Root open={open} onOpenChange={setOpen}>
        {children}
      </Dialog.Root>
    </VersionCompareContext.Provider>
  );
};

const Trigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Dialog.Trigger>{children}</Dialog.Trigger>;
};

const Content: React.FC = () => {
  const { promptId, versions, setOpen } = useVersionCompare();
  const [leftVersion, setLeftVersion] = useState(versions[versions.length - 2]);
  const [rightVersion, setRightVersion] = useState(
    versions[versions.length - 1],
  );

  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );

  const { data: leftPromptVersion } = promptsAPI.useGetPromptVersionQuery(
    { promptId, version: leftVersion, projectId: currentProjectId! },
    { skip: !currentProjectId },
  );

  const { data: rightPromptVersion } = promptsAPI.useGetPromptVersionQuery(
    { promptId, version: rightVersion, projectId: currentProjectId! },
    { skip: !currentProjectId },
  );

  return (
    <Dialog.Content style={{ maxWidth: 900 }}>
      <Dialog.Title>Compare Versions</Dialog.Title>

      <Flex gap="4" direction="column">
        <Flex gap="4">
          <Select.Root
            value={String(leftVersion)}
            onValueChange={(v) => setLeftVersion(Number(v))}
          >
            <Select.Trigger placeholder="Select version" />
            <Select.Content>
              {versions.map((v) => (
                <Select.Item key={v} value={String(v)}>
                  Version {v}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Select.Root
            value={String(rightVersion)}
            onValueChange={(v) => setRightVersion(Number(v))}
          >
            <Select.Trigger placeholder="Select version" />
            <Select.Content>
              {versions.map((v) => (
                <Select.Item key={v} value={String(v)}>
                  Version {v}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex gap="4">
          <CodeMirror
            value={leftPromptVersion?.content || ""}
            readOnly
            style={{ flex: 1 }}
          />
          <CodeMirror
            value={rightPromptVersion?.content || ""}
            readOnly
            style={{ flex: 1 }}
          />
        </Flex>
      </Flex>

      <Flex gap="3" mt="4" justify="end">
        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
          Close
        </Button>
      </Flex>
    </Dialog.Content>
  );
};

// Attach components to VersionCompareDialog
VersionCompareDialog.Trigger = Trigger;
VersionCompareDialog.Content = Content;

export default VersionCompareDialog;
