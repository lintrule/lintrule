import ignore from "../ignore.js";
import { ignoredPatterns } from "../walkTextFiles.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { Table } from "https://deno.land/x/cliffy@v0.24.2/table/table.ts";

async function estimateTotalCostPerRule() {
  const log = Deno.run({
    cmd: [
      "git",
      "log",
      "--since=1.months",
      "--until=now",
      "--numstat",
      '--pretty=format:""',
    ],
    stdout: "piped",
    cwd: Deno.cwd(),
  });

  const output = await log.output();
  const changes = new TextDecoder()
    .decode(output)
    .split("\n")
    .filter((l) => l && l.trim() !== "" && l !== '""')
    .map((l) => l.split("\t"))
    .map(([additions, deletions, filename]) => {
      return {
        additions: parseInt(additions),
        deletions: parseInt(deletions),
        filename,
      };
    });

  const contextBufferSize = 35;
  const linesOfCode = changes.reduce((acc, change) => {
    const ig = ignore().add(ignoredPatterns);

    // Skip ignored files
    if (ig.ignores(change.filename)) {
      return acc;
    }

    if (!change.additions) {
      return acc;
    }

    return acc + change.additions + contextBufferSize;
  }, 0);

  const totalCostPerRule = linesOfCode / 1000;

  return totalCostPerRule;
}

export async function countNumContributors() {
  // git log --since='1 month ago' --pretty="%an"

  const log = Deno.run({
    cmd: ["git", "log", "--since=1.months", "--pretty=%an"],
    stdout: "piped",
    cwd: Deno.cwd(),
  });

  const output = await log.output();

  const contributors = new TextDecoder().decode(output).split("\n");

  const uniqueContributors = new Set(contributors);

  return uniqueContributors.size;
}

export async function estimateBillingCommand() {
  // git log with numstat
  // git log --since="$one_month_ago" --until="$current_date" --numstat --pretty=format:""

  const totalCostPerRule = await estimateTotalCostPerRule();
  const numContributors = await countNumContributors();

  const costPerContributor = totalCostPerRule / numContributors;

  console.log(
    colors.bold(
      `\nBilling estimate ${colors.italic("per ruleset, per month")}\n`
    )
  );
  const table = new Table(
    [colors.dim("  $ per contributor"), `$${costPerContributor.toFixed(2)}`],
    [colors.dim("  $ total cost"), `$${totalCostPerRule.toFixed(2)}`],
    [colors.dim("  num contributors"), `${numContributors}`]
  );

  console.log(table.toString());

  // What's a ruleset?
  console.log(colors.bold("\nWhat's a ruleset?"));
  console.log(
    colors.dim(
      `  
  It's a single file in your rules folder. A ruleset can have 
  about 25 to 30 checks in it. You might have one ruleset per 
  language, or per part of your codebase. For example, you might 
  have a ruleset for SQL migrations and another for your 
  frontend.`
    )
  );

  // What's a ruleset?
  console.log(colors.bold("\nHow can I reduce costs?"));
  console.log(
    colors.dim(
      `  
  This estimator assumes you're running \`rules check\` on every
  commit and you're running every rule on every file. Consider
  using the \`include: ["**/yourfiles.sql"]\` property to limit
  rulesets to only important files.`
    )
  );
}
