import { join } from "https://deno.land/std@0.185.0/path/mod.ts";

export async function initCmd() {
  // If there's not already a rules directory
  // add one
  await Deno.mkdir("rules", { recursive: true });

  // Add a markdown file called "no-bugs.md"
  await Deno.writeTextFile(
    join("rules", "no-bugs.md"),
    "don't approve obvious bugs."
  );

  // Print out an instruction to login and then run rules check
  console.log(`You're ready to go! Try running:
  rules login
  rules check`);
}
