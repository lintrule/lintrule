import { findRoot } from "./findRoot.ts";
import { check } from "./rules.ts";
import { walkFiles } from "./walkFiles.ts";

const rootDir = await findRoot();

const root = rootDir || Deno.cwd();
const gitignorePath = ".gitignore";

for await (const entry of walkFiles(root, gitignorePath)) {
  console.log(entry.path);
  const result = await check(
    "https://lintrule.deno.dev",
    entry.path,
    gitignorePath
  );

  console.log(`pass: ${result.pass} message: ${result.message}`);
}
