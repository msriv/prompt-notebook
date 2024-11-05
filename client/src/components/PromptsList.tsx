import {
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  IconButton,
  SegmentedControl,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { promptsAPI } from "../store/api/prompts";
import { useAppSelector } from "../store/hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useNavigate } from "react-router-dom";
import {
  collectionsApi,
  useGetCollectionsQuery,
} from "../store/api/collections";
import { MouseEvent, useState } from "react";
import {
  IconNotes,
  IconFolders,
  TablerIcon,
  IconCheck,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react";

interface Prompt {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface CopyBadgeProps {
  slug: string;
  onDelete?: (e: MouseEvent) => void;
  showDelete?: boolean;
}

const CopyBadge = ({ slug, onDelete, showDelete = false }: CopyBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when copying
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(e);
  };

  return (
    <Flex align="center" gap="2">
      <Badge size="1" color="violet">
        {slug}
      </Badge>
      <Tooltip content={copied ? "Copied!" : "Copy slug"}>
        <IconButton size="1" variant="ghost" onClick={handleCopy}>
          {copied ? (
            <IconCheck size={11} strokeWidth={1.5} />
          ) : (
            <IconCopy size={11} strokeWidth={1.5} />
          )}
        </IconButton>
      </Tooltip>
      {showDelete && (
        <Tooltip content="Delete">
          <IconButton
            size="1"
            variant="ghost"
            color="red"
            onClick={handleDelete}
          >
            <IconTrash size={11} strokeWidth={1.5} />
          </IconButton>
        </Tooltip>
      )}
    </Flex>
  );
};

const EmptyState = ({
  type,
  icon: Icon,
  message,
}: {
  type: string;
  icon: TablerIcon;
  message: string;
}) => (
  <Flex direction="column" align="center" justify="center" gap="3" py="8">
    <Icon size={48} strokeWidth={1.5} />
    <Text size="3" weight="medium" color="gray">
      {message}
    </Text>
  </Flex>
);

const PromptsList = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("prompts");
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );

  const { data: prompts, isFetching: isLoadingPrompts } =
    promptsAPI.useGetPromptsQuery(
      currentProjectId
        ? {
            project_id: currentProjectId,
          }
        : skipToken,
    );

  const { data: collections, isFetching: isLoadingCollections } =
    useGetCollectionsQuery(
      currentProjectId
        ? {
            projectId: currentProjectId,
          }
        : skipToken,
    );

  const [deletePrompt] = promptsAPI.useDeletePromptMutation();
  const [deleteCollection] = collectionsApi.useDeleteCollectionMutation();

  const handleDeletePrompt = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this prompt?")) {
      try {
        await deletePrompt({
          promptId,
          projectId: currentProjectId,
        }).unwrap();
      } catch (error) {
        console.error("Failed to delete prompt:", error);
      }
    }
  };

  const handleDeleteCollection = async (
    collectionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      currentProjectId &&
      confirm("Are you sure you want to delete this collection?")
    ) {
      try {
        await deleteCollection({
          collection_id: collectionId,
          project_id: currentProjectId,
        }).unwrap();
      } catch (error) {
        console.error("Failed to delete collection:", error);
      }
    }
  };

  const renderPrompts = () => {
    if (isLoadingPrompts) return <div>Loading prompts...</div>;
    if (!prompts?.length) {
      return (
        <EmptyState
          type="prompts"
          icon={IconNotes}
          message="No prompts found. Create your first prompt to get started."
        />
      );
    }

    return (
      <Grid columns="3" gap="3" rows="repeat(2, 64px)" width="auto">
        {prompts.map((prompt: Prompt) => (
          <Card
            key={prompt.id}
            className="cursor-pointer"
            onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
          >
            <Box>
              <Flex direction="row" gap="2" justify={"between"}>
                <Text as="div" size="2" weight="bold" truncate>
                  {prompt.name}
                </Text>
                <CopyBadge
                  slug={prompt.slug}
                  showDelete={true}
                  onDelete={(e) => handleDeletePrompt(prompt.id, e)}
                />
              </Flex>
              <Text as="div" size="2" color="gray" truncate>
                {prompt.description}
              </Text>
            </Box>
          </Card>
        ))}
      </Grid>
    );
  };

  const renderCollections = () => {
    if (isLoadingCollections) return <div>Loading collections...</div>;
    if (!collections?.length) {
      return (
        <EmptyState
          type="collections"
          icon={IconFolders}
          message="No collections found. Create a collection to organize your prompts."
        />
      );
    }

    return (
      <Grid columns="3" gap="3" rows="repeat(2, 64px)" width="auto">
        {collections.map((collection: Collection) => (
          <Card
            key={collection.id}
            className="cursor-pointer"
            onClick={() => navigate(`/collections/${collection.slug}`)}
          >
            <Box>
              <Flex direction="row" gap="2" justify={"between"}>
                <Text as="div" size="2" weight="bold" truncate>
                  {collection.name}
                </Text>
                <CopyBadge
                  slug={collection.slug}
                  showDelete={true}
                  onDelete={(e: React.MouseEvent) => {
                    handleDeleteCollection(collection.id, e);
                  }}
                />
              </Flex>
              <Text as="div" size="2" color="gray" truncate>
                {collection.description}
              </Text>
            </Box>
          </Card>
        ))}
      </Grid>
    );
  };

  return (
    <div>
      <SegmentedControl.Root
        defaultValue="prompts"
        value={currentView}
        onValueChange={setCurrentView}
      >
        <SegmentedControl.Item value="prompts">
          All Prompts
        </SegmentedControl.Item>
        <SegmentedControl.Item value="collections">
          Collections
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      <Box my="2">
        {currentView === "prompts" ? renderPrompts() : renderCollections()}
      </Box>
    </div>
  );
};

export default PromptsList;
