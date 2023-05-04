import {
  normalize,
  globToRegExp,
} from "https://deno.land/std@0.185.0/path/mod.ts";

export async function parseGitignore(gitignorePath: string): Promise<string[]> {
  try {
    const gitignoreContent = await Deno.readFile(gitignorePath);
    const gitignoreLines = new TextDecoder()
      .decode(gitignoreContent)
      .split("\n");

    return gitignoreLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (error) {
    console.error("Error reading .gitignore file:", error);
    return [];
  }
}

export function isIgnored(filepath: string, gitignoreRules: string[]): boolean {
  const normalizedFilepath = normalize(filepath);
  let isMatched = false;

  for (const rule of gitignoreRules) {
    const isNegation = rule.startsWith("!");
    const normalizedRule = isNegation ? rule.slice(1) : rule;

    // Add '**/' pattern to the beginning of the non-rooted rules
    const modifiedRule = normalizedRule.startsWith("/")
      ? normalizedRule
      : `**/${normalizedRule}`;

    const regex = new RegExp(globToRegExp(modifiedRule));
    const matches = regex.test(normalizedFilepath);

    if (matches) {
      isMatched = !isNegation;
    }
  }

  return isMatched;
}
