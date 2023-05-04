// test.ts

import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { isIgnored } from "./ignore.ts";

Deno.test("isIgnored: basic test", () => {
  const gitignoreRules = [
    "*.log",
    "!important.log",
    "node_modules/",
    "/build/",
    "/*.txt",
  ];

  assertEquals(isIgnored("file.log", gitignoreRules), true);
  assertEquals(isIgnored("important.log", gitignoreRules), false);
  assertEquals(
    isIgnored("node_modules/dependency/index.js", gitignoreRules),
    true
  );
  assertEquals(isIgnored("src/build/index.js", gitignoreRules), false);
  assertEquals(isIgnored("build/index.js", gitignoreRules), true);
  assertEquals(isIgnored("test.txt", gitignoreRules), true);
  assertEquals(isIgnored("src/test.txt", gitignoreRules), false);
});

Deno.test("isIgnored: bangs! work", () => {
  const gitignoreRules = ["*.log", "!important.log"];

  assertEquals(isIgnored("important.log", gitignoreRules), false);
});

Deno.test("isIgnored: node_modules", () => {
  const gitignoreRules = ["node_modules/"];

  assertEquals(
    isIgnored("node_modules/dependency/index.js", gitignoreRules),
    true
  );
});

Deno.test("isIgnored: test with no rules", () => {
  const gitignoreRules: string[] = [];

  assertEquals(isIgnored("file.log", gitignoreRules), false);
  assertEquals(
    isIgnored("node_modules/dependency/index.js", gitignoreRules),
    false
  );
});

Deno.test("isIgnored: test with only negation rules", () => {
  const gitignoreRules = ["!*.log"];

  assertEquals(isIgnored("file.log", gitignoreRules), false);
  assertEquals(isIgnored("important.log", gitignoreRules), false);
});
