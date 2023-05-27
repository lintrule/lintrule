import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { getLocalVersion } from "../cli/version.ts";

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
  await gh.status();
} catch (error) {
  logAndError("Please install the 'gh' command first: brew install gh");
}

function bumpedVersion(
  version: string,
  type: "major" | "minor" | "patch" | "prerelease"
) {
  const [major, minor, patch] = version.split(".").map((v) =>
    parseInt(
      // Remove everything after the - if there is one
      v.includes("-") ? v.split("-")[0] : v
    )
  );
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

async function saveVersion(version: string) {
  // Save the version in the cli.json file
  const cliJsonPath = "cli/cli.json";
  const cliJson = await Deno.readTextFile(cliJsonPath);
  const cli = JSON.parse(cliJson);
  cli.version = version;
  await Deno.writeTextFile(cliJsonPath, JSON.stringify(cli, null, 2));
}

const COMPILE_TARGETS = [
  "x86_64-unknown-linux-gnu", // x86 linux
  "x86_64-pc-windows-msvc", // PCs
  "x86_64-apple-darwin", // intel macs
  "aarch64-apple-darwin", // m1 macs / arm
];

async function compileDistribution() {
  for (const target of COMPILE_TARGETS) {
    const p = Deno.run({
      cmd: [
        "deno",
        "compile",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-net",
        "--allow-run",
        "--target",
        target,
        "--output",

        `dist/rules-${target}`,
        "cli/main.ts",
      ],
    });
    const status = await p.status();
    if (!status.success) {
      logAndError("Failed to compile the distribution");
    }

    // Zip the binary
    const zip = Deno.run({
      cmd: [
        "zip",
        "-j",
        `dist/rules-${target}.zip`,
        `dist/rules-${target}`,
        "cli/cli.json",
      ],
    });
    const zipStatus = await zip.status();
    if (!zipStatus.success) {
      logAndError("Failed to zip the distribution");
    }
  }
}

async function createRelease(version: string) {
  // Only take the zip files
  const distFiles = [...Deno.readDirSync("./dist")]
    .filter((entry) => entry.isFile)
    .filter((entry) => entry.name.endsWith(".zip"))
    .map((entry) => `./dist/${entry.name}`);

  console.log(distFiles);
  const cmds = [
    "gh",
    "release",
    "create",
    version,
    ...distFiles,
    "--generate-notes",
  ];

  if (!version.includes("pre")) {
    cmds.push("--latest");
  } else {
    cmds.push("--prerelease");
  }

  console.log(cmds.join(" "));

  const p = Deno.run({
    cmd: cmds,
  });
  const status = await p.status();
  if (!status.success) {
    logAndError("Failed to create the release");
  }

  // git add cli/cli.json
  // and commit with the name `release: vVersion`
  const p2 = Deno.run({
    cmd: ["git", "add", "cli/cli.json"],
  });
  const status2 = await p2.status();
  if (!status2.success) {
    logAndError("Failed to add cli/cli.json");
  }

  const p3 = Deno.run({
    cmd: ["git", "commit", "-m", `release: v${version}`],
  });
  const status3 = await p3.status();
  if (!status3.success) {
    logAndError("Failed to commit cli/cli.json");
  }

  const p4 = Deno.run({
    cmd: ["git", "push"],
  });
  const status4 = await p4.status();
  if (!status4.success) {
    logAndError("Failed to push cli/cli.json");
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
    const version = await getLocalVersion();
    const bumped = bumpedVersion(version, type);
    await saveVersion(bumped);
    await compileDistribution();
    await createRelease(bumped);
  })
  .parse(Deno.args);
