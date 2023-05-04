import { walkFiles } from "./walkFiles.ts";

console.log("hi");

const root = ".";
const gitignorePath = ".gitignore";

for await (const entry of walkFiles(root, gitignorePath)) {
  console.log(entry.path);
}
