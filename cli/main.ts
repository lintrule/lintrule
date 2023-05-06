import { findRoot } from "./findRoot.ts";
import { check } from "./rules.ts";
import { walkTextFiles } from "./walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const rulesDir = `${root}/rules`;
const gitignorePath = ".gitignore";

async function checkRuleAgainstEntry(rulePath: string, entryPath: string) {
  const result = await check("https://lintrule.deno.dev", entryPath, rulePath);

  const relativeEntry = relative(root, entryPath);
  const relativeRuleEntry = relative(root, rulePath);
  if (result.pass) {
    console.log(
      `${colors.bgGreen(
        colors.brightWhite(" PASS ")
      )} ${relativeEntry} ${relativeRuleEntry}`
    );
  } else {
    fails += 1;
    console.log(
      `${colors.bgRed(
        colors.brightWhite(" FAIL ")
      )} ${relativeEntry} ${relativeRuleEntry}\n${result.message}`
    );
  }
}

const now = Date.now();
let fails = 0;
const promises = [];
for await (const entry of walkTextFiles(root, gitignorePath)) {
  // for every file in the rules dir
  for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
    promises.push(checkRuleAgainstEntry(ruleEntry.path, entry.path));
  }
}
await Promise.all(promises);

if (fails) {
  console.log(colors.dim(`Finished in ${Date.now() - now}ms`));
  console.log(colors.red(`${fails} rules failed`));
  Deno.exit(1);
} else {
  console.log(colors.dim(`Finished in ${Date.now() - now}ms`));
  console.log(colors.green("All rules passed"));
}
