import { getMultipleValuesInput } from "../common/utils";
import { getDataWithThrottle } from "./getDataWithThrottle";
import { getPullRequests } from "./getPullRequests";
import { Options, Repository } from "./types";

export const makeComplexRequest = async (
  amount: number = 100,
  repository: Repository,
  options: Options = {
    skipComments: true,
  }
) => {
  const excludedPatterns = [
    /\/generated\.go$/,  // 精確匹配 "generated.go"
    /\/models_gen\.go$/, // 精確匹配 "models_gen.go"
  ];
  const pullRequests = await getPullRequests(amount, repository);

  const pullRequestNumbers = pullRequests
    .filter((pr) => {
      const excludeLabels = getMultipleValuesInput("EXCLUDE_LABELS");
      const includeLabels = getMultipleValuesInput("INCLUDE_LABELS");
      const isIncludeLabelsCorrect =
        includeLabels.length > 0
          ? pr.labels.some((label) => includeLabels.includes(label.name))
          : true;
      const isExcludeLabelsCorrect =
        excludeLabels.length > 0
          ? !pr.labels.some((label) => excludeLabels.includes(label.name))
          : true;
      return isIncludeLabelsCorrect && isExcludeLabelsCorrect;
    })
    .map((item) => item.number);

  const { PRs, PREvents, PRComments } = await getDataWithThrottle(
    pullRequestNumbers,
    repository,
    options,
    excludedPatterns
  );

  const events = PREvents.map((element) =>
    element.status === "fulfilled" ? element.value.data : null
  );

  const pullRequestInfo = PRs.map((element) =>
    element.status === "fulfilled" ? element.value.data : null
  );

  const comments = PRComments.map((element) =>
    element.status === "fulfilled" ? element.value.data : null
  );

  return {
    ownerRepo: `${repository.owner}/${repository.repo}`,
    events,
    pullRequestInfo,
    comments,
  };
};
