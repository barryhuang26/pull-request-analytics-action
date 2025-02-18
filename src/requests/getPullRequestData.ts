import { Repository } from "./types";

import { octokit } from "../octokit";
import { commonHeaders } from "./constants";

export const getPullRequestDatas = async (
  pullRequestNumbers: number[],
  repository: Repository,
  excludedPatterns: (RegExp)[] = []
) => {
  const { owner, repo } = repository;

  const enrichedPullRequests = await Promise.all(
    pullRequestNumbers.map(async (prNumber) => {
      // 🔹 取得 PR 基本資料
      const prData = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        headers: commonHeaders,
      });

      // 🔹 取得 PR 變更的檔案
      const prFiles = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        headers: commonHeaders,
      });

      let totalAdditions = 0;
      let totalDeletions = 0;

      prFiles.data.forEach((file) => {
        const isExcluded = excludedPatterns.some((pattern) =>
          pattern.test(file.filename)
        );
        if (!isExcluded) {
          totalAdditions += file.additions;
          totalDeletions += file.deletions;
        }
      });

      // 🔹 覆寫 `additions` 和 `deletions`
      prData.data = {
        ...prData.data, // 保留 PR 其他欄位
        additions: totalAdditions,
        deletions: totalDeletions,
      };

      return prData
    })
  );

  return enrichedPullRequests;
};
