import { findRoot } from "../../findRoot.ts";
import { check } from "./rules.ts";
import { walkTextFiles } from "../../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import { readConfig } from "../../config.ts";
import { Change, getChangesAsHunks } from "../../git.ts";
import * as frontmatter from "https://deno.land/x/frontmatter@v0.1.5/mod.ts";
import { globToRegExp } from "https://deno.land/std@0.36.0/path/glob.ts";
import { exists } from "https://deno.land/std@0.97.0/fs/mod.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();

const plainRulesDir = `${root}/rules`;
const dotRulesDir = `${root}/.rules`;
const gitignorePath = ".gitignore";

async function checkAndLogRuleFileAgainst(props: {
  rulePath: string;
  change: {
    file: string;
    snippet: string;
  };
  host: string;
  accessToken: string;
}) {
  const now = Date.now();
  const rule = await Deno.readTextFile(props.rulePath);
  const result = await check({
    document: props.change.snippet,
    rule: rule,
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
      )} ${relativeRuleEntry} ${colors.dim(`(${totalTime}ms)`)}`
    );
    if (result.skipped.reason === "context_too_big") {
      console.log(`${colors.dim("\n  The diff is too big to check :(")}`);
    }
    if (result.skipped.reason === "rate_limit") {
      console.log(
        `${colors.dim(
          "\n  You're doing that too much and hitting rate limits."
        )}`
      );
    }
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
    const tag = colors.bgRed(colors.brightWhite(" x FAIL "));

    const header = `  ${tag} ${relativeRuleEntry} ${colors.dim(
      "=>"
    )} ${relativeEntry} ${colors.dim(`(${totalTime}ms)`)}`;

    console.log(`${header}\n  \n${result.message}\n`);
    return false;
  }
}

async function checkAndLogMessageAgainstFileAndSnippet(props: {
  message: string;
  change: {
    file: string;
    snippet: string;
  };
  host: string;
  accessToken: string;
}) {
  const now = Date.now();
  const result = await check({
    document: props.change.snippet,
    rule: props.message,
    host: props.host,
    accessToken: props.accessToken,
  });
  const totalTime = Date.now() - now;

  const relativeEntry = relative(root, props.change.file);

  // Take only the first 20 characters of the message
  let msg = props.message;
  if (msg.length > 20) {
    msg = msg.slice(0, 20) + "...";
  }

  if (result.skipped) {
    console.log(
      `  ${colors.bgYellow(" ⚠️ SKIP ")} ${relativeEntry} ${colors.dim(
        "=>"
      )} ${relativeEntry} ${colors.dim(`(${totalTime}ms)`)}`
    );
    if (result.skipped.reason === "context_too_big") {
      console.log(`${colors.dim("\n  The diff is too big to check :(")}`);
    }
    if (result.skipped.reason === "rate_limit") {
      console.log(
        `${colors.dim(
          "\n  You're doing that too much and hitting rate limits."
        )}`
      );
    }
    return true;
  }

  if (result.pass) {
    console.log(
      `  ${colors.bgBrightGreen(" ✔️ PASS ")} ${msg} ${colors.dim(
        "=>"
      )} ${relativeEntry} ${colors.dim(`(${totalTime}ms)`)}`
    );
    return true;
  } else {
    console.log(
      `  ${colors.bgRed(
        colors.brightWhite(" x FAIL ")
      )} ${relativeEntry} ${msg}\n${result.message} ${colors.dim(
        `(${totalTime}ms)`
      )}`
    );
    return false;
  }
}

async function getRulesDir() {
  // If the `.rules` dir exists, use that
  if (await exists(dotRulesDir)) {
    return dotRulesDir;
  }

  // If the `.rules` dir doesn't exist, but the `rules` dir does, use that
  if (await exists(plainRulesDir)) {
    return plainRulesDir;
  }

  // If neither exists, tell the user to run `rules init`
  console.log(
    `No .rules folder found. Please run ${colors.bold(
      "`rules init`"
    )} to create a .rules folder.`
  );
  Deno.exit(1);
}

async function toArray<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}

export async function checkRulesAgainstDiff(props: {
  host: string;
  accessToken: string;
  diff?: string;
}) {
  const accessToken = props.accessToken;

  const files: Array<{
    change: Change;
    rulePath: string;
  }> = [];
  const rulesDir = await getRulesDir();
  const allRuleEntries = await toArray(walkTextFiles(rulesDir, gitignorePath));

  for (const ruleEntry of allRuleEntries) {
    const file = await Deno.readTextFile(ruleEntry.path);
    const result: { data?: { include?: string[] }; content: string } =
      frontmatter.parse(file) as any;

    for await (const change of getChangesAsHunks(props.diff)) {
      // Don't include rules in rules
      if (allRuleEntries.map((r) => r.path).includes(change.file)) {
        continue;
      }

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
  if (files.length > 1000) {
    throw new Error("Too many files to check at once. Please check less files");
  }

  // If there's no files found, explain to the user about diffs
  if (files.length === 0) {
    printNoChangesFound();
    Deno.exit(0);
  }

  console.log(colors.dim(`\nFound ${files.length} changed files...\n`));

  const now = Date.now();
  const promises = [];
  for (const file of files) {
    promises.push(
      checkAndLogRuleFileAgainst({
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
    console.log(`\n${colors.bgRed(` ${failed.length} rules failed. `)}\n`);
    Deno.exit(1);
  }
  console.log(colors.dim(`\nFinished. (${Date.now() - now}ms)\n`));
}

function printNoChangesFound() {
  console.log(`
No changes found.

Lintrule runs on diffs by default and skips large files 
or things in your .gitignore. You can run Lintrule against 
more changes with --diff. 

For example:
  
  # Changes since since two commits ago 
  rules check --diff HEAD^^

  # Changes between a branch
  rules check --diff main..feature
`);
}

async function checkMessageAgainstDiff(props: {
  host: string;
  accessToken: string;
  diff?: string;
  message: string;
}) {
  const files = [];
  for await (const change of getChangesAsHunks(props.diff)) {
    files.push({
      change,
      message: props.message,
    });
  }

  // Add a little sanity check for runaway files atm
  if (files.length > 1000) {
    throw new Error("Too many files to check at once. Please check less files");
  }

  if (files.length === 0) {
    printNoChangesFound();
    Deno.exit(0);
  }

  console.log(colors.dim(`\nFound ${files.length} changed files...\n`));

  const now = Date.now();
  const promises = [];
  for (const file of files) {
    promises.push(
      checkAndLogMessageAgainstFileAndSnippet({
        host: props.host,
        message: file.message,
        change: file.change,
        accessToken: props.accessToken,
      })
    );
  }
  const results = await Promise.all(promises);
  const failed = results.filter((r) => !r);
  if (failed.length > 0) {
    console.log(`\n${colors.bgRed(` ${failed.length} rules failed. `)}\n`);
    Deno.exit(1);
  }
  console.log(colors.dim(`\nFinished. (${Date.now() - now}ms)\n`));
}

async function existsAndIsFile(path: string) {
  const exist = await exists(path);
  if (!exist) return false;
  const stat = await Deno.stat(path);
  return stat.isFile;
}

async function checkMessageAgainstFiles(props: {
  host: string;
  accessToken: string;
  diff?: string;
  message: string;
  files: string;
}) {
  const files = [];

  // Check if 'root' is a file
  if (await existsAndIsFile(props.files)) {
    const txt = await Deno.readTextFile(props.files);
    files.push({
      filePath: props.files,
      document: txt,
      message: props.message,
    });
  } else {
    const root = props.files || Deno.cwd();
    for await (const file of walkTextFiles(root, gitignorePath)) {
      const txt = await Deno.readTextFile(file.path);

      files.push({
        filePath: file.path,
        document: txt,
        message: props.message,
      });
    }
  }

  // Hard limit of 100 files, to avoid runaway scripts
  if (files.length > 1000) {
    throw new Error("Too many files to check at once. Please check less files");
  }

  // Confirm if more than 5 files.
  if (files.length > 5) {
    const confirm = prompt(
      `You are about to check ${files.length} files. Are you sure? (Y/n)`,
      "n"
    );
    const confirmed = confirm == "Y" || confirm == "y";
    if (!confirmed) {
      console.log("Aborting.");
      Deno.exit(1);
    }
  }

  console.log(colors.dim(`\nFound ${files.length} changed files...\n`));

  const now = Date.now();
  const promises = [];
  for (const file of files) {
    promises.push(
      checkAndLogMessageAgainstFileAndSnippet({
        host: props.host,
        message: file.message,
        change: {
          file: file.filePath,
          snippet: file.document,
        },
        accessToken: props.accessToken,
      })
    );
  }
  const results = await Promise.all(promises);
  const failed = results.filter((r) => !r);
  if (failed.length > 0) {
    console.log(`\n${colors.bgRed(` ${failed.length} rules failed. `)}\n`);
    Deno.exit(1);
  }
  console.log(colors.dim(`\nFinished. (${Date.now() - now}ms)\n`));
}

export async function checkRulesAgainstFiles(props: {
  host: string;
  accessToken: string;
  files: string;
}) {
  const files = [];

  const rulesDir = await getRulesDir();
  for await (const rule of walkTextFiles(rulesDir, gitignorePath)) {
    // Check if 'root' is a file
    if (await existsAndIsFile(props.files)) {
      const txt = await Deno.readTextFile(props.files);
      files.push({
        filePath: props.files,
        document: txt,
        rulePath: rule.path,
      });
    } else {
      const root = props.files || Deno.cwd();
      for await (const file of walkTextFiles(root, gitignorePath)) {
        const txt = await Deno.readTextFile(file.path);

        files.push({
          filePath: file.path,
          document: txt,
          rulePath: rule.path,
        });
      }
    }
  }

  // Hard limit of 100 files, to avoid runaway scripts
  if (files.length > 1000) {
    throw new Error("Too many files to check at once. Please check less files");
  }

  // Confirm if more than 5 files.
  if (files.length > 5) {
    const confirm = prompt(
      `You are about to check ${files.length} files. Are you sure? (Y/n)`,
      "n"
    );
    const confirmed = confirm == "Y" || confirm == "y";
    if (!confirmed) {
      console.log("Aborting.");
      Deno.exit(1);
    }
  }

  console.log(colors.dim(`\nFound ${files.length} files...\n`));

  const now = Date.now();
  const promises = [];
  for (const file of files) {
    promises.push(
      checkAndLogRuleFileAgainst({
        host: props.host,
        rulePath: file.rulePath,
        change: {
          file: file.filePath,
          snippet: file.document,
        },
        accessToken: props.accessToken,
      })
    );
  }
  const results = await Promise.all(promises);
  const failed = results.filter((r) => !r);
  if (failed.length > 0) {
    console.log(colors.bgRed(`\n ${failed.length} rules failed. `), "\n");
    Deno.exit(1);
  }
  console.log(colors.dim(`\nFinished. (${Date.now() - now}ms)\n`));
}

export async function checkCmd(props: {
  host: string;
  secret?: string;
  diff?: string;
  message?: string;

  // The root to check files against
  files?: string;
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

  // Check if there's a .gitignore
  const gitignore = await exists(gitignorePath);

  if (!gitignore && !props.files) {
    console.log(
      `No .gitignore found. \`rules check\` is meant to be run in a git repository.\nIf you want to check a specific file, use \`rules check --files <path>\``
    );
    Deno.exit(1);
  }

  if (props.files && props.diff) {
    console.log("Cannot use --files and --diff at the same time");
    Deno.exit(1);
  }

  if (props.message && props.files) {
    return checkMessageAgainstFiles({
      host: props.host,
      accessToken: accessToken,
      message: props.message,
      files: props.files,
    });
  }

  if (!props.message && props.files) {
    return checkRulesAgainstFiles({
      host: props.host,
      accessToken: accessToken,
      files: props.files,
    });
  }

  if (props.message) {
    return checkMessageAgainstDiff({
      host: props.host,
      accessToken: accessToken,
      diff: props.diff,
      message: props.message,
    });
  }

  return checkRulesAgainstDiff({
    host: props.host,
    accessToken: accessToken,
    diff: props.diff,
  });
}
