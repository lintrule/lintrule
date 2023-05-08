import ignore from "../ignore.js";
import { ignoredPatterns } from "../walkTextFiles.ts";

export async function estimateBillingCommand() {
  // git log with numstat
  // git log --since="$one_month_ago" --until="$current_date" --numstat --pretty=format:""
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

  let linesOfCode = 0;

  // For each change, try to find the file, count how many lines
  // of code it is, and then add it to the total
  for (const change of changes) {
    try {
      const size = await Deno.stat(change.filename).then((s) => s.size);
      linesOfCode += size;
    } catch (e) {
      linesOfCode += 500;
    }
  }

  console.log(`Lintrule would cost $${linesOfCode / 1000} in the last month`);
}
