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

  const walkOptions: WalkOptions = {
    includeDirs: false,
    skip: [/^\./], // Skips hidden files and directories by default
    exts: [], // List of extensions to include, empty for all
  };

  // gitignore content to lines
  const ignoreLines = gitignoreContent.split("\n");
  const ig = ignore().add(ignoreLines);

  for await (const entry of walk(root, walkOptions)) {
    if (!ig.ignores(entry.path)) {
      yield entry;
    }
    yield entry;
  }
}
