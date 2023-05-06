import {
  walk,
  WalkEntry,
  WalkOptions,
} from "https://deno.land/std@0.115.0/fs/mod.ts";
import ignore from "./ignore.js";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";

export async function* walkFiles(
  root: string,
  gitignorePath: string
): AsyncGenerator<WalkEntry> {
  const gitignoreContent = await Deno.readTextFile(gitignorePath);

  const walkOptions: WalkOptions = {};

  // gitignore content to lines
  const ignoreLines = gitignoreContent.split("\n");
  const ig = ignore().add(ignoreLines);

  for await (const entry of walk(root, walkOptions)) {
    // Ignore the .git folder
    if (entry.path.includes(".git")) {
      continue;
    }

    if (entry.isDirectory) {
      continue;
    }

    // Turn this into a relative path so it matches the gitignore
    // in deno
    entry.path = relative(root, entry.path);

    if (ig.ignores(entry.path)) {
      continue;
    }
    yield entry;
  }
}
