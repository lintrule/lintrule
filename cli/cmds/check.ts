import { findRoot } from "../findRoot.ts";
import { check } from "../rules.ts";
import { walkTextFiles } from "../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import { readConfig } from "../config.ts";
import { getChangesAsFiles } from "../git.ts";
import * as frontmatter from "https://deno.land/x/frontmatter@v0.1.5/mod.ts";
import { globToRegExp } from "https://deno.land/std@0.36.0/path/glob.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const rulesDir = `${root}/rules`;
const gitignorePath = ".gitignore";

async function checkRuleAgainstEntry(props: {
  rulePath: string;
  change: {
    file: string;
    snippet: string;
  };
  host: string;
  accessToken: string;
}) {
  const now = Date.now();
  const result = await check({
    change: props.change,
    rulePath: props.rulePath,
    host: props.host,
    accessToken: props.accessToken,
  });
  const totalTime = Date.now() - now;

  const relativeEntry = relative(root, props.change.file);
  const relativeRuleEntry = relative(root, props.rulePath);

  if (result.skipped) {
    console.log(
      `  ${colors.bgYellow(" ⚠️ SKIP ")} ${relativeEntry} ${colors.dim(
        "=>"
      )} ${relativeRuleEntry}\nThe diff is too big to check :( ${colors.dim(
        `(${totalTime}ms)`
      )}`
    );
    return true;
  }

  if (result.pass) {
    console.log(
      `  ${colors.bgBrightGreen(" ✔️ PASS ")} ${relativeRuleEntry} ${colors.dim(
        "=>"
      )} ${relativeEntry} ${colors.dim(`(${totalTime}ms)`)}`
    );
    return true;
  } else {
    console.log(
      `  ${colors.bgRed(
        colors.brightWhite(" FAIL ")
      )} ${relativeEntry} ${relativeRuleEntry}\n${result.message} ${colors.dim(
        `(${totalTime}ms)`
      )}`
    );
    return false;
  }
}

export async function checkCmd(props: {
  host: string;
  secret?: string;
  diff?: string;
}) {
  const config = await readConfig();
  const accessToken = props.secret || config.accessToken;
  if (!accessToken) {
    console.log("Please run 'rules login' first.");
    Deno.exit(1);
  }
  if (!accessToken.startsWith("sk_")) {
    console.log(
      `Lintrule secret does not start with 'sk_'. Here's some details about it:

${colors.bold("Ends with:")}: ${accessToken.slice(-3)}
${colors.bold("Length:")}: ${accessToken.length}`
    );
    Deno.exit(1);
  }

  const files = [];
  for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
    const file = await Deno.readTextFile(ruleEntry.path);
    const result: { data?: { include?: string[] }; content: string } =
      frontmatter.parse(file) as any;

    for await (const change of getChangesAsFiles(props.diff)) {
      if (result.data?.include) {
        const include = result.data.include;
        if (!Array.isArray(include)) {
          throw new Error("Include must be an array");
        }
        const includeRegexes = include.map((i) => globToRegExp(i));
        const shouldInclude = includeRegexes.some((r) => r.test(change.file));
        if (!shouldInclude) {
          continue;
        }
      }

      files.push({
        change,
        rulePath: ruleEntry.path,
      });
    }
  }

  // Add a little sanity check for runaway files atm
  if (files.length > 100) {
    throw new Error("Too many files to check at once. Please check less files");
  }

  console.log(colors.dim(`\nFound ${files.length} changed files...\n`));

  const now = Date.now();
  const promises = [];
  for (const file of files) {
    promises.push(
      checkRuleAgainstEntry({
        host: props.host,
        rulePath: file.rulePath,
        change: file.change,
        accessToken: accessToken,
      })
    );
  }

  const results = await Promise.all(promises);
  const failed = results.filter((r) => !r);
  if (failed.length > 0) {
    console.log(colors.bgRed(`  ${failed.length} rules failed. `));
    Deno.exit(1);
  }
  console.log(colors.dim(`\nFinished. (${Date.now() - now}ms)\n`));
}
