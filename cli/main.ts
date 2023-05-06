import { findRoot } from "./findRoot.ts";
import { walkFiles } from "./walkFiles.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const gitignorePath = ".gitignore";

for await (const entry of walkFiles(root, gitignorePath)) {
  console.log(entry.path);
}
