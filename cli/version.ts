export async function readVersion() {
  // Look for the 'cli.json' file
  const cliJsonPath = "cli/cli.json";
  const cliJson = await Deno.readTextFile(cliJsonPath);

  // Parse the JSON
  const cli = JSON.parse(cliJson);
  if (!cli.version) {
    throw new Error("No version found in cli.json");
  }

  return cli.version;
}
