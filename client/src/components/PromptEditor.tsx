import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Callout,
  Dialog,
  DropdownMenu,
  Flex,
  IconButton,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import {
  IconArrowBack,
  IconDeviceFloppy,
  IconDots,
  IconFolderPlus,
  IconGitCompare,
  IconInfoCircle,
  IconTestPipe,
  IconX,
} from "@tabler/icons-react";
import { markdown } from "@codemirror/lang-markdown";
import { Extension } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { promptsAPI } from "../store/api/prompts";
import { useAppSelector } from "../store/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import TestPrompt from "./TestPrompt";
import { tagsApi } from "../store/api/tags";
import AddToCollectionDialog from "./AddToCollectionDialog";
import VersionCompareDialog from "./VersionCompareDialog";
import TestPromptDialog from "./TestPromptDialog";

const customHighlighter = (format: string): Extension => {
  const variableRegex =
    format === "jinja2" ? /\{\{\s*(\w+)\s*\}\}/g : /\{(\w+)\}/g;

  return EditorView.decorations.of((view) => {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to);
      let match;
      while ((match = variableRegex.exec(text)) !== null) {
        const start = from + match.index;
        const end = start + match[0].length;
        builder.add(
          start,
          end,
          Decoration.mark({
            class: "cm-variable-highlight",
          }),
        );
      }
    }
    return builder.finish();
  });
};

const customTheme = EditorView.theme({
  ".cm-variable-highlight": {
    color: "var(--accent-9)",
    fontWeight: "bold",
    backgroundColor: "var(--accent-3)",
  },
  "&": {
    height: "100%",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

const PromptEditor = () => {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("jinja2");
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [promptId, setPromptId] = useState<string | null>(urlId || null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isVersionChanging, setIsVersionChanging] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isAddToCollectionDialogOpen, setIsAddToCollectionDialogOpen] =
    useState(false);
  const [isVersionCompareDialogOpen, setIsVersionCompareDialogOpen] =
    useState(false);

  const [createPrompt] = promptsAPI.useCreatePromptMutation();
  const [updatePrompt] = promptsAPI.useUpdatePromptMutation();
  const [createTag] = tagsApi.useCreateTagMutation();
  const [deleteTag] = tagsApi.useDeleteTagMutation();

  const { data: existingPrompt, isLoading } = promptsAPI.useGetPromptQuery(
    { promptId, projectId: currentProjectId },
    {
      skip: !promptId || !currentProjectId,
    },
  );
  const { data: promptVersion } = promptsAPI.useGetPromptVersionQuery(
    promptId && selectedVersion && currentProjectId
      ? {
          promptId,
          version: selectedVersion,
          projectId: currentProjectId,
        }
      : skipToken,
  );

  const { data: tags, isLoading: isLoadingTags } = tagsApi.useGetTagsQuery(
    promptId && selectedVersion && currentProjectId
      ? { promptId, version: selectedVersion, projectId: currentProjectId }
      : skipToken,
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (existingPrompt) {
      setName(existingPrompt.name);
      setSlug(existingPrompt.slug);
      setDescription(existingPrompt.description);
      setFormat(existingPrompt.template_format);
      setVersions(existingPrompt.versions);
      setSelectedVersion(existingPrompt.versions.at(-1));
    }
  }, [existingPrompt]);

  const handleVersionChange = (value: string) => {
    setIsVersionChanging(true);
    setSelectedVersion(parseInt(value));
  };

  useEffect(() => {
    if (promptVersion) {
      setContent(promptVersion.content);
      setIsVersionChanging(false);
    }
  }, [promptVersion]);

  const extensions = useCallback(
    (): Extension[] => [
      markdown(),
      customHighlighter(format),
      customTheme,
      EditorView.lineWrapping,
      // Add any additional markdown highlighting rules here
    ],
    [format],
  );

  const handleSavePrompt = async () => {
    setIsSaving(true);
    const promptData: {
      name: string;
      slug: string;
      description: string;
      template_format: string;
      content?: string;
    } = {
      name,
      slug,
      description,
      template_format: format,
    };

    if (!promptId || content !== promptVersion?.content) {
      promptData.content = content;
    }

    try {
      if (currentProjectId) {
        if (promptId) {
          await updatePrompt({
            promptId,
            projectId: currentProjectId,
            body: promptData,
          }).unwrap();
        } else {
          const response = await createPrompt({
            body: promptData,
            project_id: currentProjectId,
          }).unwrap();
          setPromptId(response.id);
        }
      }
    } catch (error) {
      console.log("Error saving prompt:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (newTag && promptId && selectedVersion && !isCreatingTag) {
      setIsCreatingTag(true);
      const tagExists = tags?.some(
        (tag) => tag.name.toLowerCase() === newTag.toLowerCase(),
      );

      if (tagExists) {
        // Optionally show an error message that tag already exists
        console.error("Tag already exists");
        setNewTag("");
        setIsCreatingTag(false);
        return;
      }
      try {
        if (currentProjectId) {
          await createTag({
            promptId,
            version: selectedVersion,
            tag: { name: newTag },
            projectId: currentProjectId,
          }).unwrap();
          setNewTag("");
        }
      } catch (error) {
        console.error("Failed to create tag:", error);
        // You might want to show an error message to the user here
      } finally {
        setIsCreatingTag(false);
      }
    }
  };

  const handleRemoveTag = async (tagId: string, tagName: string) => {
    if (tagName === "latest") {
      // Optionally show a message to user that latest tag cannot be deleted
      return;
    }
    if (promptId && selectedVersion && currentProjectId) {
      try {
        await deleteTag({
          promptId,
          version: selectedVersion,
          tagId,
          projectId: currentProjectId,
        }).unwrap();
      } catch (error) {
        console.error("Failed to delete tag:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  const isCreateValid = useCallback(() => {
    return (
      name.trim() !== "" &&
      slug.trim() !== "" &&
      description.trim() !== "" &&
      content.trim() !== ""
    );
  }, [name, slug, description, content]);

  const isUpdateValid = useCallback(() => {
    if (!existingPrompt || !promptVersion || isVersionChanging) return false;

    const hasChanges =
      name.trim() !== existingPrompt.name ||
      slug.trim() !== existingPrompt.slug ||
      description?.trim() !== existingPrompt.description ||
      content.trim() !== promptVersion.content;

    const hasValidFields =
      name.trim() !== "" && slug.trim() !== "" && description?.trim() !== "";

    return hasChanges && hasValidFields;
  }, [
    name,
    slug,
    description,
    content,
    existingPrompt,
    promptVersion,
    isVersionChanging,
  ]);

  if (promptId && isLoading) return <div>Loading...</div>;

  return (
    <>
      <Flex direction="column" gap="2" className="h-full overflow-hidden">
        <Flex direction="row" justify="between" mb="2" gap={"2"}>
          <Button variant="soft" onClick={() => navigate("/")}>
            <IconArrowBack strokeWidth={1.5} size={20} />
            Back to Prompts
          </Button>
          <Flex gap="2">
            <Button
              onClick={handleSavePrompt}
              loading={isSaving}
              disabled={promptId ? !isUpdateValid() : !isCreateValid()}
            >
              <IconDeviceFloppy strokeWidth={1.5} size={20} />
              {promptId ? "Update Prompt" : "Create Prompt"}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="soft">
                  <IconDots size={20} />
                </Button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => setIsTestDialogOpen(true)}>
                  <IconTestPipe size={16} />
                  Test Prompt
                </DropdownMenu.Item>

                {promptId && (
                  <DropdownMenu.Item
                    onClick={() => setIsAddToCollectionDialogOpen(true)}
                  >
                    <IconFolderPlus size={16} />
                    Add to Collection
                  </DropdownMenu.Item>
                )}

                {promptId && (
                  <DropdownMenu.Item
                    disabled={versions.length < 2}
                    onClick={() => setIsVersionCompareDialogOpen(true)}
                  >
                    <IconGitCompare size={16} />
                    Compare Versions
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
        <Flex
          direction="row"
          gap="4"
          className="flex-grow min-h-0 overflow-hidden"
        >
          <Flex
            direction="column"
            gap="3"
            className="w-8/12 min-h-0 overflow-hidden"
          >
            <Flex
              direction="column"
              gap="2"
              style={{ borderRadius: "var(--radius-3)" }}
              className="border border-gray-200 p-4 flex-grow min-h-0 overflow-hidden"
            >
              <Text size="4" weight="bold">
                Prompt Content
              </Text>
              <Flex
                direction="column"
                className="flex-grow min-h-0 overflow-hidden"
              >
                <div className="h-full overflow-auto">
                  <CodeMirror
                    value={content}
                    onChange={(value) => setContent(value)}
                    extensions={extensions()}
                    style={{
                      fontSize: 12,
                      border: "1px solid #ccc",
                      padding: "4px",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              </Flex>
            </Flex>
          </Flex>
          <Flex
            direction="column"
            gap="3"
            className="w-4/12 min-h-0 overflow-hidden"
          >
            <Flex
              direction="column"
              gap="2"
              style={{ borderRadius: "var(--radius-3)" }}
              className="border border-gray-200 p-4 overflow-auto"
            >
              <Text size="4" weight="bold">
                Prompt Details
              </Text>
              <Flex direction="column" gap="3" flexGrow={"1"}>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Name
                  </Text>
                  <TextField.Root
                    value={name}
                    placeholder="Enter prompt name"
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(
                        e.target.value.toLowerCase().replace(/[\s_]+/g, "-"),
                      );
                    }}
                  />
                </label>
              </Flex>
              <Flex direction="column" gap="3" flexGrow={"1"}>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Slug
                  </Text>
                  <TextField.Root
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value.toLowerCase().replace(/[\s_]+/g, "-"),
                      )
                    }
                    placeholder="enter-slug-here"
                  />
                </label>
              </Flex>
              <Flex direction="column" gap="3" flexGrow={"1"}>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Description
                  </Text>
                  <TextArea
                    value={description}
                    placeholder="Enter prompt description"
                    resize={"vertical"}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
              </Flex>
              <Flex direction="column" gap="3" flexGrow={"1"}>
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Template Format
                  </Text>
                  <Select.Root
                    defaultValue="jinja2"
                    value={format}
                    onValueChange={(value) => setFormat(value)}
                  >
                    <Select.Trigger
                      placeholder="Pick a Format"
                      className="w-full"
                    />
                    <Select.Content className="w-full">
                      <Select.Item value="jinja2">Jinja2</Select.Item>
                      <Select.Item value="f-string">F String</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </label>
                <Callout.Root size="1">
                  <Callout.Icon>
                    <IconInfoCircle />
                  </Callout.Icon>
                  <Callout.Text>
                    Use{" "}
                    {format === "jinja2" ? " {{ variable }} " : " {variable} "}
                    to insert variables into your prompt.
                  </Callout.Text>
                </Callout.Root>
              </Flex>
              {promptId && (
                <>
                  <Flex direction="column" gap="3" flexGrow={"1"}>
                    <label>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Versions
                      </Text>
                      <Select.Root
                        value={`${selectedVersion}`}
                        onValueChange={handleVersionChange}
                      >
                        <Select.Trigger
                          placeholder="Pick a Format"
                          className="w-full"
                        />
                        <Select.Content className="w-full">
                          {versions.map((version, index) => (
                            <Select.Item key={index} value={`${version}`}>
                              {`v${version}`}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                  </Flex>
                  <Flex direction="column" gap="3" flexGrow={"1"}>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Tags
                    </Text>
                    <Flex direction="row" gap="2" wrap="wrap" mb="2">
                      {isLoadingTags ? (
                        <Text size="1">Loading tags...</Text>
                      ) : !tags?.length ? (
                        <Text size="1" className="text-gray-500">
                          No tags yet
                        </Text>
                      ) : (
                        tags.map((tag) => (
                          <Flex
                            key={tag.id}
                            align="center"
                            justify="between"
                            py="1"
                            style={{
                              backgroundColor:
                                tag.name === "latest"
                                  ? "var(--accent-4)"
                                  : "var(--accent-3)",
                              borderRadius: "var(--radius-2)",
                              position: "relative",
                            }}
                            className={
                              tag.name === "latest" ? "opacity-50" : "pe-1"
                            }
                          >
                            <Text size="1" className="px-2">
                              {tag.name}
                            </Text>
                            {tag.name !== "latest" && (
                              <IconButton
                                variant="ghost"
                                size="1"
                                onClick={() =>
                                  handleRemoveTag(tag.id, tag.name)
                                }
                              >
                                <IconX strokeWidth={1.5} size={16} />
                              </IconButton>
                            )}
                          </Flex>
                        ))
                      )}
                    </Flex>
                    <Flex direction="row" gap="2">
                      <TextField.Root
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter a tag"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        style={{ zIndex: 0 }}
                      />
                      <Button
                        onClick={handleAddTag}
                        disabled={
                          !newTag.trim() || !promptId || !selectedVersion
                        }
                        loading={isCreatingTag}
                      >
                        Add Tag
                      </Button>
                    </Flex>
                  </Flex>
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      {promptId && (
        <Dialog.Root open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <TestPromptDialog
            initialVariables={{}} // Pass extracted variables here
            promptContent={content}
            promptFormat={format}
            onRunTest={(variables) => {
              console.log("Testing with variables:", variables);
              // Add your test logic here
            }}
          />
        </Dialog.Root>
      )}
      {promptId && (
        <AddToCollectionDialog
          isOpen={isAddToCollectionDialogOpen}
          onOpenChange={setIsAddToCollectionDialogOpen}
          promptId={promptId}
        >
          <AddToCollectionDialog.Content />
        </AddToCollectionDialog>
      )}
      {promptId && (
        <VersionCompareDialog
          promptId={promptId}
          versions={versions}
          isOpen={isVersionCompareDialogOpen}
          onOpenChange={setIsVersionCompareDialogOpen}
        >
          <VersionCompareDialog.Content />
        </VersionCompareDialog>
      )}
    </>
  );
};

export default PromptEditor;
