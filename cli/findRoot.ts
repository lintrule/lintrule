// The root folder is the one with the `rules` directory in it.
import { join } from "https://deno.land/std@0.185.0/path/mod.ts";

const RULES_FOLDER_NAME = "rules";

async function isRoot(folder: string) {
  const entries = await Deno.readDir(folder);
  for await (const entry of entries) {
    if (entry.name === RULES_FOLDER_NAME) {
      return true;
    }
    if (entry.name === ".git") {
      return true;
    }
  }
  return false;
}

export async function findRoot() {
  // Check if we're in the root folder
  const root = Deno.cwd();
  if (await isRoot(root)) {
    return root;
  }

  // Otherwise keep checking the parent directory until we find it
  // or we run out of parents
  let parent = root;
  while (true) {
    parent = join(parent, "..");

    if (await isRoot(parent)) {
      return parent;
    } else if (parent === "/") {
      return null;
    }
  }
}
