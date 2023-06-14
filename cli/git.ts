import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { gitdiff } from "./vendor/gitdiff/gitdiff.ts";

export function parseDiffToFiles(diff: string) {
  return gitdiff.parse(diff);
}

export async function getDiffInGithubActionPullRequest() {
  const head = Deno.env.get("GITHUB_HEAD_REF");
  if (!head) {
    throw new Error("GITHUB_HEAD_REF is not defined");
  }
  const ref = Deno.env.get("GITHUB_BASE_REF");
  if (!ref) {
    throw new Error("GITHUB_BASE_REF is not defined");
  }

  await gitFetch(head);
  await gitFetch(ref);

  const p = new Deno.Command("git", {
    args: ["diff", `${ref}..${head}`],
    stdout: "piped",
  });

  console.log(colors.dim(`\n$ git diff ${ref}..${head}`));

  const { code, stdout, stderr } = await p.output(); // "p.output()" returns a promise that resolves with the raw output

  if (code !== 0) {
    const err = new TextDecoder().decode(stderr);
    if (err.includes("fatal: ambiguous argument")) {
      console.error(`rules can't find previous code to compare against. Try checking that your checkout step has 'fetch-depth' of 2 or higher. For example:

- uses: actions/checkout@v2
  with:
    fetch-depth: 2

    `);
    }

    throw new Error(err);
  }

  const text = new TextDecoder().decode(stdout); // Convert the raw output into a string

  return text;
}

export async function gitFetch(ref: string) {
  const p = new Deno.Command("git", {
    args: ["fetch", `origin`, `${ref}:${ref}`],
    stdout: "piped",
  });

  const { code } = await p.output();
  if (code !== 0) {
    throw new Error("git fetch failed");
  }
}

export async function getDiffInGithubAction() {
  const head = Deno.env.get("GITHUB_SHA");
  if (!head) {
    throw new Error("GITHUB_SHA is not defined");
  }
  const ref = Deno.env.get("GITHUB_REF");
  if (!ref) {
    throw new Error("GITHUB_REF is not defined");
  }

  await gitFetch(head);
  await gitFetch(ref);

  const p = new Deno.Command("git", {
    args: ["diff", `${ref}..${head}`],
    stdout: "piped",
  });

  console.log(colors.dim(`\n$ git diff ${ref}..${head}`));
  const { code, stdout, stderr } = await p.output(); // "p.output()" returns a promise that resolves with the raw output

  if (code !== 0) {
    const err = new TextDecoder().decode(stderr);
    if (err.includes("fatal: ambiguous argument")) {
      console.error(`rules can't find previous code to compare against. Try checking that your checkout step has 'fetch-depth' of 2 or higher. For example:

- uses: actions/checkout@v2
  with:
    fetch-depth: 2

    `);
    }

    throw new Error(err);
  }

  const text = new TextDecoder().decode(stdout); // Convert the raw output into a string

  return text;
}

export async function getSpecificDiff(diff: string) {
  const p = new Deno.Command("git", {
    args: ["diff", diff],
    stdout: "piped",
  });

  const { code, stdout, stderr } = await p.output(); // "p.output()" returns a promise that resolves with the raw output

  console.log(colors.dim(`\n$ git diff ${diff}`));
  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  const text = new TextDecoder().decode(stdout); // Convert the raw output into a string

  return text;
}

export async function getDiff(diff?: string) {
  if (diff) {
    return getSpecificDiff(diff);
  }

  // If we're in a github action inside a PR, use that diff
  if (Deno.env.get("GITHUB_HEAD_REF")) {
    return getDiffInGithubActionPullRequest();
  }

  // If we're in a github action, use the github action diff
  if (Deno.env.get("GITHUB_BASE_REF")) {
    return getDiffInGithubAction();
  }

  const p = new Deno.Command("git", {
    args: ["diff", "HEAD^"],
    stdout: "piped",
  });

  const { code, stdout, stderr } = await p.output(); // "p.output()" returns a promise that resolves with the raw output

  console.log(colors.dim(`\n$ git diff HEAD^`));
  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  const text = new TextDecoder().decode(stdout); // Convert the raw output into a string

  return text;
}

export async function* getChangesAsFiles(diff?: string) {
  const text = await getDiff(diff);
  const files = parseDiffToFiles(text);

  for (const file of files) {
    try {
      if (file.type === "delete") {
        continue;
      }

      // Read the file
      const p = await Deno.readFile(file.newPath);
      const text = new TextDecoder().decode(p);

      yield {
        file: file.newPath,
        snippet: text,
      };
    } catch (err) {
      console.error(colors.dim(`Missing file: ${file.newPath}`));
      continue;
    }
  }
}
