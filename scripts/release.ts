import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";

function logAndError(msg: string) {
  console.log(colors.bgRed(" Error "), colors.red(msg));
  Deno.exit(1);
}

// Check if the 'gh' command exists
try {
  const gh = Deno.run({
    cmd: ["gh", "--version"],
    stdout: "null",
    stderr: "null",
  });
} catch (error) {
  logAndError("Please install the 'gh' command first: brew install gh");
}

function bumpVersion(
  version: string,
  type: "major" | "minor" | "patch" | "prerelease"
) {
  const [major, minor, patch] = version.split(".").map((v) => parseInt(v));
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "prerelease":
      return `${major}.${minor}.${patch}-pre.${Date.now()}`;
  }
}

async function readVersion() {
  // Look for the 'cli.json' file
  const cliJsonPath = "cli/cli.json";
  const cliJson = await Deno.readTextFile(cliJsonPath);

  // Parse the JSON
  const cli = JSON.parse(cliJson);
  if (!cli.version) {
    logAndError("No 'version' found in cli/cli.json");
  }

  return cli.version;
}

async function compileDistribution() {
  const p = Deno.run({
    cmd: ["deno", "compile", "cli/main.ts", "--ouput", "dist/rules"],
  });
  const status = await p.status();
  if (!status.success) {
    logAndError("Failed to compile the distribution");
  }
}

async function createRelease(version: string) {
  const cmds = [
    "gh",
    "release",
    "create",
    version,
    "dist/rules",
    "--generate-notes",
  ];

  if (!version.includes("pre")) {
    cmds.push("--latest");
  } else {
    cmds.push("--prerelease");
  }

  const p = Deno.run({
    cmd: cmds,
  });
  const status = await p.status();
  if (!status.success) {
    logAndError("Failed to create the release");
  }
}

await new Command()
  .name("releaser")
  .version("0.0.1")
  .description("A github release tool for the cli")
  .arguments("[type]")
  .action(async (_, type) => {
    if (!type) {
      logAndError(
        "Please specify a release type: major, minor, patch, prerelease"
      );
      return;
    }
    if (
      type !== "major" &&
      type !== "minor" &&
      type !== "patch" &&
      type !== "prerelease"
    ) {
      logAndError(
        "Argument must be 'major', 'minor' or 'patch' or 'prerelease'"
      );
      return;
    }
    const version = await readVersion();
    const newVersion = bumpVersion(version, type);
    await compileDistribution();
    await createRelease(newVersion);
  })
  .parse(Deno.args);
