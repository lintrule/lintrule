// The root folder is the one with the `rules` directory in it.

const RULES_FOLDER_NAME = "rules";

async function isRoot(folder: string) {
  const entries = await Deno.readDir(folder);
  for await (const entry of entries) {
    if (entry.name === RULES_FOLDER_NAME) {
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
    parent = new URL("..", parent).pathname;
    if (await isRoot(parent)) {
      return parent;
    } else if (parent === "/") {
      return null;
    }
  }
}
