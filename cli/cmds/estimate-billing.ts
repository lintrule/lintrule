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

  const contextBufferSize = 50;
  const linesOfCode = changes.reduce((acc, change) => {
    if (!change.additions) {
      return acc;
    }

    return acc + change.additions + contextBufferSize;
  }, 0);

  console.log(
    `Lintrule would cost $${linesOfCode / 1000} in the last month per rule`
  );
}
