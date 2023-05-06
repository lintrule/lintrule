import {
  walk,
  WalkEntry,
  WalkOptions,
} from "https://deno.land/std@0.115.0/fs/mod.ts";
import ignore from "./ignore.js";

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

    if (ig.ignores(entry.path)) {
      continue;
    }
    yield entry;
  }
}
