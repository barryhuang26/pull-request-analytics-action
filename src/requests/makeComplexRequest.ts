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
  const excludedFilePatterns = [
    /generated\.go$/,
    /models_gen\.go$/,
    /.*_settings\.json$/,
    /dd3ServerGraphQL\//,
    /package\.json$/,
    /pnpm-lock\.yaml$/,
    /dd3DomainTestSeed\/Resources\//,
    /dd3DomainModelTests\/Resources\//,
    /dudooPOS3\/[^\/]+\.xcstrings$/,
    /dudooPOS3.xcodeproj\//,
    /dudooPOS3.xcworkspace\//,
    /src\/locales\//
  ];

  const defaultExcludedDiffLinePatterns = [/github\.com\/dudoo-team\//];

  const parseRegex = (pattern: string) => {
    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) {
      return null;
    }
    const literalMatch = /^\/(.+)\/([a-z]*)$/i.exec(trimmedPattern);
    try {
      if (literalMatch) {
        return new RegExp(literalMatch[1], literalMatch[2]);
      }
      return new RegExp(trimmedPattern);
    } catch (error) {
      console.warn(
        `Unable to parse regex from EXCLUDE_DIFF_LINE_PATTERNS value "${trimmedPattern}": ${(error as Error).message}`
      );
      return null;
    }
  };

  const excludedDiffLinePatterns = [
    ...defaultExcludedDiffLinePatterns,
    ...getMultipleValuesInput("EXCLUDE_DIFF_LINE_PATTERNS")
      .map(parseRegex)
      .filter((pattern): pattern is RegExp => !!pattern),
  ];

  const pullRequests = await getPullRequests(amount, repository);

  const excludeLabels = getMultipleValuesInput("EXCLUDE_LABELS");
  const includeLabels = getMultipleValuesInput("INCLUDE_LABELS");

  const pullRequestNumbers = pullRequests
    .filter((pr) => {
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
    excludedFilePatterns,
    excludedDiffLinePatterns
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
