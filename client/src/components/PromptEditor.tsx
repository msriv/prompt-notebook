import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Callout,
  Flex,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import {
  IconArrowBack,
  IconDeviceFloppy,
  IconInfoCircle,
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
  const { id } = useParams();
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
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [createPrompt] = promptsAPI.useCreatePromptMutation();
  const [updatePrompt] = promptsAPI.useUpdatePromptMutation();
  const { data: existingPrompt, isLoading } = promptsAPI.useGetPromptQuery(id, {
    skip: !id,
  });
  const { data: promptVersion } = promptsAPI.useGetPromptVersionQuery(
    id && selectedVersion
      ? {
          promptId: id,
          version: selectedVersion,
        }
      : skipToken,
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

  useEffect(() => {
    if (promptVersion) {
      setContent(promptVersion.content);
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
    const promptData = {
      name,
      slug,
      description,
      content,
      format,
      project_id: currentProjectId,
    };

    if (id) {
      await updatePrompt({ promptId: id, body: promptData }).unwrap();
    } else {
      await createPrompt(promptData).unwrap();
      navigate("/"); // Redirect to prompts list after saving
    }
    setIsSaving(false);
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (id && isLoading) return <div>Loading...</div>;

  return (
    <Flex direction="column" gap="2" className="h-full overflow-hidden">
      <Flex direction="row" justify="between" mb="2" gap={"2"}>
        <Button variant="soft" onClick={() => navigate("/")}>
          <IconArrowBack strokeWidth={1.5} size={20} />
          Back to Prompts
        </Button>
        <Button onClick={handleSavePrompt} loading={isSaving}>
          <IconDeviceFloppy strokeWidth={1.5} size={20} />
          {id ? "Update Prompt" : "Create Prompt"}
        </Button>
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
                    borderRadius: "4px",
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
            {id && (
              <>
                <Flex direction="column" gap="3" flexGrow={"1"}>
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Versions
                    </Text>
                    <Select.Root
                      value={`${selectedVersion}`}
                      onValueChange={(value) =>
                        setSelectedVersion(parseInt(value))
                      }
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
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Tags
                    </Text>
                    <Flex direction="row" gap="2" wrap="wrap" mb="2">
                      {tags.map((tag) => (
                        <Flex
                          key={tag}
                          align="center"
                          justify="between"
                          px="2"
                          py="1"
                          style={{
                            backgroundColor: "var(--accent-3)",
                            borderRadius: "var(--radius-2)",
                          }}
                        >
                          <Text size="1">{tag}</Text>
                          <Button
                            variant="ghost"
                            size="1"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <IconX strokeWidth={1.5} size={16} />
                          </Button>
                        </Flex>
                      ))}
                    </Flex>
                    <Flex direction="row" gap="2">
                      <TextField.Root
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter a tag"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button onClick={handleAddTag}>Add Tag</Button>
                    </Flex>
                  </label>
                </Flex>
              </>
            )}
          </Flex>
          <TestPrompt promptFormat={format} promptContent={content} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PromptEditor;
