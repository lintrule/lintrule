import { findRoot } from "../findRoot.ts";
import { check } from "../rules.ts";
import { walkTextFiles } from "../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const rulesDir = `${root}/rules`;
const gitignorePath = ".gitignore";

async function checkRuleAgainstEntry(props: {
  rulePath: string;
  entryPath: string;
  apiHost: string;
}) {
  const result = await check(props.apiHost, props.entryPath, props.rulePath);

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

export async function checkCmd(props: { apiHost: string }) {
  const promises = [];
  for await (const entry of walkTextFiles(root, gitignorePath)) {
    // for every file in the rules dir
    for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
      promises.push(
        checkRuleAgainstEntry({
          apiHost: props.apiHost,
          rulePath: ruleEntry.path,
          entryPath: entry.path,
        })
      );
    }
  }
  await Promise.all(promises);
}
