import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { parseDiffToHunks, parseDiffToFiles } from "./git.ts"; // Assuming the function is in this module
import { currentFolder } from "./currentFilePath.ts";
import { join } from "https://deno.land/std@0.107.0/path/mod.ts";

Deno.test("parseDiff function", () => {
  const diff = `+++ file1.js
@@ -64,17 +82,19 @@ 
+++ file2.js
@@ -10,5 +20,7 @@`;

  const expected = [
    { file: "file1.js", x: 64, y: 17, z: 82, w: 19 },
    { file: "file2.js", x: 10, y: 5, z: 20, w: 7 },
  ];

  const result = parseDiffToHunks(diff);

  assertEquals(result, expected);
});

Deno.test("parseDiff function", () => {
  const diff = `+++ file1.js
@@ -64,17 +82,19 @@`;

  const expected = [{ file: "file1.js", x: 64, y: 17, z: 82, w: 19 }];

  const result = parseDiffToHunks(diff);

  assertEquals(result, expected);
});

Deno.test("parseDiff when file deleted", () => {
  const diff = `diff --git a/README.md b/README.md
deleted file mode 100644
index 98584f5..0000000
--- a/README.md
+++ /dev/null
@@ -1,3 +0,0 @@
-# Lintrule
-
-[Lintrule](https://lintrule.com) is a new kind of linter and test framework.`;

  const files = parseDiffToFiles(diff);

  assertEquals(files, []);
});
