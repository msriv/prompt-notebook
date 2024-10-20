import {
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  SegmentedControl,
  Text,
} from "@radix-ui/themes";
import { promptsAPI } from "../store/api/prompts";
import { useAppSelector } from "../store/hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useNavigate } from "react-router-dom";

interface Prompt {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const PromptsList = () => {
  const navigate = useNavigate();
  const currentProjectId = useAppSelector(
    (state) => state.project.currentProjectId,
  );
  const { data, isFetching } = promptsAPI.useGetPromptsQuery(
    currentProjectId
      ? {
          project_id: currentProjectId,
        }
      : skipToken,
  );

  if (isFetching) return <div>Loading...</div>;
  if (!data) return <div>No Prompts created</div>;

  return (
    <div>
      <SegmentedControl.Root defaultValue="prompts">
        <SegmentedControl.Item value="prompts">
          All Prompts
        </SegmentedControl.Item>
        <SegmentedControl.Item value="collections">
          Collections
        </SegmentedControl.Item>
      </SegmentedControl.Root>
      <Grid columns="3" gap="3" rows="repeat(2, 64px)" width="auto" my="2">
        {data.map((prompt: Prompt) => (
          <Card
            key={prompt.id}
            className="cursor-pointer"
            onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
          >
            <Box>
              <Flex direction={"row"} gap={"2"}>
                <Text as="div" size="2" weight="bold">
                  {prompt.name}
                </Text>
                <Badge size="1" color="violet">
                  {prompt.slug}
                </Badge>
              </Flex>
              <Text as="div" size="2" color="gray">
                {prompt.description}
              </Text>
            </Box>
          </Card>
        ))}
      </Grid>
    </div>
  );
};

export default PromptsList;
