import { Collection } from "../converters/types";
import {
  createConfigParamsCode,
  createPullRequestQualityTable,
  createReferences,
  createResponseTable,
  createReviewTable,
  createTimelineContent,
  createTotalTable,
} from "./utils";
import { getMultipleValuesInput } from "../common/utils";

export const createMarkdown = (
  data: Record<string, Record<string, Collection>>,
  users: string[],
  dates: string[],
  title: string = "Pull Request report",
  references: { title: string; link: string }[] = []
) => {
  const contentTypes = getMultipleValuesInput("SHOW_STATS_TYPES");

  const content = dates.map((date) => {
    if (!data.total[date]?.merged) return "";

    const contentMap: Record<string, string> = {
      timeline: createTimelineContent(data, users, date),
      workload: createTotalTable(data, users, date),
      "code-review-engagement": createReviewTable(data, users, date),
      "pr-quality": createPullRequestQualityTable(data, users, date),
      "response-time": createResponseTable(data, users, date),
    };

    return `
    ${contentTypes
      .map((type) => contentMap[type])
      .filter((content) => content)
      .join("\n")}
    `;
  });

  if (content.join("").trim() === "") return "";

  const issueDescription = `This report based on ${
    data.total?.total?.closed || 0
  } last updated PRs. To learn more about the project and its configuration, please visit [Pull request analytics action](https://github.com/AlexSim93/pull-request-analytics-action).
  ${createConfigParamsCode()}`;

  // 格式化 data & users 為 JSON 字串，方便檢查每筆數據
  const formattedData = JSON.stringify(data, null, 2).slice(0, 10000) + "\n\n... (truncated)";
  const formattedUsers = JSON.stringify(users, null, 2);
 
  return `
## ${title}
  ${dates.includes("total") ? issueDescription : ""}
  ${createReferences(references)}
    ${content.join("\n")}
   **Data Details:**
  \`\`\`json
  ${formattedData}
  \`\`\`

  **Users:**
  \`\`\`json
  ${formattedUsers}
  \`\`\`
  `;
};
