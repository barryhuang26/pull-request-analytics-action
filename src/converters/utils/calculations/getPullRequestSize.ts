import { calcPRsize } from "./calcPRsize";

export type PullRequestSize = "xs" | "s" | "m" | "l" | "xl";

export const getPullRequestSize = (
  additions: number | undefined,
  deletions: number | undefined
): PullRequestSize => {
  const size = calcPRsize(additions, deletions);
  if (size <= 500) {
    return "xs";
  }
  if (size <= 1000) {
    return "s";
  }
  if (size <= 1500) {
    return "m";
  }
  if (size <= 3000) {
    return "l";
  }
  return "xl";
};
