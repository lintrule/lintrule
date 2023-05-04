import {
  walk,
  WalkEntry,
  WalkOptions,
} from "https://deno.land/std@0.115.0/fs/mod.ts";

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

  for await (const entry of walk(root, walkOptions)) {
    // if (!ignore.ignores(entry.path)) {
    //   yield entry;
    // }
    yield entry;
  }
}
