import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import ignore from "./ignore.js";

// Define the ignore function
function isPathIgnored(entryPath: string, gitignoreContent: string): boolean {
  const ignoreLines = gitignoreContent.split("\n");
  const ig = ignore().add(ignoreLines);
  return ig.ignores(entryPath);
}

Deno.test("ignore", () => {
  const gitignoreContent = `
# Ignore node_modules
node_modules

# Ignore all .log files
*.log

# Exclude files
!app.log
    `;

  const testCases = [
    { entryPath: "node_modules/package.json", shouldBeIgnored: true },
    { entryPath: "src/index.js", shouldBeIgnored: false },
    { entryPath: "error.log", shouldBeIgnored: true },
    { entryPath: "app.log", shouldBeIgnored: false },
  ];

  for (const testCase of testCases) {
    const { entryPath, shouldBeIgnored } = testCase;
    const isIgnored = isPathIgnored(entryPath, gitignoreContent);
    assertEquals(
      isIgnored,
      shouldBeIgnored,
      `The path '${entryPath}' should ${
        shouldBeIgnored ? "be ignored" : "not be ignored"
      }`
    );
  }
});
