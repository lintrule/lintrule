import { walkFiles } from "./walkFiles.ts";

const root = ".";
const gitignorePath = ".gitignore";

for await (const entry of walkFiles(root, gitignorePath)) {
  console.log(entry.path);
}
