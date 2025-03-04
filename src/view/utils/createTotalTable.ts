import { Collection } from "../../converters/types";
import {
  additionsDeletionsHeader,
  prSizesHeader,
  totalMergedPrsHeader,
  totalOpenedPrsHeader,
  totalRevertedPrsHeader,
  unapprovedPrsHeader,
  unreviewedPrsHeader,
} from "./constants";
import { createList, createTable } from "./common";
import { getValueAsIs } from "../../common/utils";
import { getPullRequestSize } from "../../converters/utils/calculations/getPullRequestSize";

export const createTotalTable = (
  data: Record<string, Record<string, Collection>>,
  users: string[],
  date: string
) => {
  const sizes = ["xs", "s", "m", "l", "xl"];
  const tableRowsTotal = users
    .filter((user) => data[user]?.[date]?.opened)
    .map((user) => {
      return [
        `**${user}**`,
        data[user]?.[date]?.opened?.toString() || "0",
        data[user]?.[date]?.merged?.toString() || "0",
        data[user]?.[date]?.reverted?.toString() || "0",
        data[user]?.[date]?.unreviewed?.toString() || "0",
        data[user]?.[date]?.unapproved?.toString() || "0",
        `+${data[user]?.[date].additions || 0}/-${
          data[user]?.[date].deletions || 0
        }`,
        `${sizes
          .map(
            (size) =>
              data[user]?.[date]?.prSizes?.filter((prSize) => prSize === size)
                .length || 0
          )
          .join("/")}`,
      ];
    });

    const excludedUsers = new Set(["qa", "rd_backend", "rd_frontend", "rd_ios", "total"]);

    const rowsTotal = users
      .filter((user) => !excludedUsers.has(user) && data[user]?.[date]?.opened) // 避開指定用戶並確保有 PR
      .flatMap((user) => {
        const pullRequests = data[user]?.[date]?.pullRequestsInfo || []; // 取得 PR 陣列
    
        return pullRequests.map((pr) => ({
          user,
          title: pr.title || "Untitled PR",
          additions: pr.additions || 0,
          deletions: pr.deletions || 0,
          sizePoints: pr.sizePoints || 0,
          pullRequestSize: getPullRequestSize(pr.additions, pr.deletions),
        }));
      })
      .sort((a, b) => b.sizePoints - a.sizePoints) // 按 sizePoints 由大到小排序
      .map((pr) => [
        `**${pr.user}**`,
        pr.title,
        `(+${pr.additions}/-${pr.deletions})`,
        `${pr.sizePoints}`,
        pr.pullRequestSize,
      ]);
    
    
  

    // 產生最大 PR 的表格數據
    // const largestPrRows = (data.total?.[date].pullRequestsInfo||[])
    // .slice()
    // .sort((a, b) => (b.sizePoints || 0) - (a.sizePoints || 0))
    // .slice(0, parseInt(getValueAsIs("TOP_LIST_AMOUNT"), 10))
    // .map((item) => [
    //   item.title || "Untitled PR",
    //   `(+${item.additions || 0}/-${item.deletions || 0})`,
    //   `${item.sizePoints|| 0}`,
    //   `${getPullRequestSize(item.additions,item.deletions)}`,
    // ]);
  


  return [
    createTable({
      title: `Contribution stats ${date}`,
      description:
        "**Reviews conducted** - number of reviews conducted. 1 PR may have only single review.\n**PR Size** - determined using the formula: `additions + deletions * 0.2`. Based on this calculation: 0-50: xs, 51-200: s, 201-400: m, 401-700: l, 701+: xl\n**Total reverted PRs** - The number of reverted PRs based on the branch name pattern `/^revert-d+/`. This pattern is used for reverts made via GitHub.",
      table: {
        headers: [
          "user",
          totalOpenedPrsHeader,
          totalMergedPrsHeader,
          totalRevertedPrsHeader,
          unreviewedPrsHeader,
          unapprovedPrsHeader,
          additionsDeletionsHeader,
          prSizesHeader,
        ],
        rows: tableRowsTotal,
      },
    }),
    createTable({
      title: "The largest PRs",
      description:
        "",
      table: {
        headers: [
          "User",
          "Branch Name",
          "Additions / Deletions",
          "PR size",
          "PR size: xs/s/m/l/xl",
        ],
        rows: rowsTotal.length > 0 ? rowsTotal : [["No data", "","",""]],
      },
    }),
  ].join("\n");
};
