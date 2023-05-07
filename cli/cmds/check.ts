import { findRoot } from "../findRoot.ts";
import { check } from "../rules.ts";
import { walkTextFiles } from "../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import { readConfig } from "../config.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const rulesDir = `${root}/rules`;
const gitignorePath = ".gitignore";

async function checkRuleAgainstEntry(props: {
  rulePath: string;
  entryPath: string;
  host: string;
  accessToken: string;
}) {
  const result = await check({
    documentPath: props.entryPath,
    rulePath: props.rulePath,
    host: props.host,
    accessToken: props.accessToken,
  });

  const relativeEntry = relative(root, props.entryPath);
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

  const promises = [];
  for await (const entry of walkTextFiles(root, gitignorePath)) {
    // for every file in the rules dir
    for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
      promises.push(
        checkRuleAgainstEntry({
          host: props.host,
          rulePath: ruleEntry.path,
          entryPath: entry.path,
          accessToken: config.accessToken,
        })
      );
    }
  }
  await Promise.all(promises);
}
