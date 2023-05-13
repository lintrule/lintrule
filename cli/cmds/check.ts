import { findRoot } from "../findRoot.ts";
import { check } from "../rules.ts";
import { walkTextFiles } from "../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import { readConfig } from "../config.ts";
import { getChanges } from "../git.ts";

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
  const result = await check({
    change: props.change,
    rulePath: props.rulePath,
    host: props.host,
    accessToken: props.accessToken,
  });

  const relativeEntry = relative(root, props.change.file);
  const relativeRuleEntry = relative(root, props.rulePath);

  if (result.pass) {
    console.log(
      `${colors.bgGreen(
        colors.brightWhite(" PASS ")
      )} ${relativeEntry} ${relativeRuleEntry}`
    );
  } else {
    console.log(
      `${colors.bgRed(
        colors.brightWhite(" FAIL ")
      )} ${relativeEntry} ${relativeRuleEntry}\n${result.message}`
    );
  }
}

export async function checkCmd(props: { host: string }) {
  const config = await readConfig();
  if (!config.accessToken) {
    console.log("Please run 'rules login' first.");
    Deno.exit(1);
  }

  const files = [];
  for await (const change of getChanges()) {
    // for every file in the rules dir
    for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
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

  const promises = [];
  for (const file of files) {
    promises.push(
      checkRuleAgainstEntry({
        host: props.host,
        rulePath: file.rulePath,
        change: file.change,
        accessToken: config.accessToken,
      })
    );
  }

  await Promise.all(promises);
}
