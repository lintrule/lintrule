import { walkFiles } from "./walkFiles.ts";

const root = ".";
const gitignorePath = ".gitignore";

for await (const entry of walkFiles(".", gitignorePath)) {
  console.log(entry);
}
