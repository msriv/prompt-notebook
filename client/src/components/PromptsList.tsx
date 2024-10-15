import { promptsAPI } from "../store/api/prompts";

const PromptsList = () => {
  const { data } = promptsAPI.useGetPromptsQuery({});
  console.log(data);
  return <div>PromptsList</div>;
};

export default PromptsList;
