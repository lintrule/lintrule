import { findRoot } from "./findRoot.ts";
import { check } from "./rules.ts";
import { walkTextFiles } from "./walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";

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
    console.log(
      `${colors.bgRed(
        colors.brightWhite(" FAIL ")
      )} ${relativeEntry} ${relativeRuleEntry}\n${result.message}`
    );
  }
}

async function checkCmd() {
  const promises = [];
  for await (const entry of walkTextFiles(root, gitignorePath)) {
    // for every file in the rules dir
    for await (const ruleEntry of walkTextFiles(rulesDir, gitignorePath)) {
      promises.push(checkRuleAgainstEntry(ruleEntry.path, entry.path));
    }
  }
  await Promise.all(promises);
}

await new Command()
  .name("rules")
  .version("0.0.1")
  .description("The english test framework")
  .action(() => console.log("Help command goes here."))
  .command("check", "Check this repository against all rules.")
  .option("-f, --foo", "Foo option.")
  .action((_options, ..._args) => checkCmd())
  .parse(Deno.args);
