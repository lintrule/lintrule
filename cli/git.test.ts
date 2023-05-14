import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { parseDiffToHunks } from "./git.ts"; // Assuming the function is in this module

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
