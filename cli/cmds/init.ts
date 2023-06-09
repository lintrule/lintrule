import { join } from "https://deno.land/std@0.185.0/path/mod.ts";
import { readConfig } from "../config.ts";
import { exists } from "https://deno.land/std@0.97.0/fs/mod.ts";

export async function initCmd() {
  // If there's not already a rules directory
  // add one
  await Deno.mkdir(".rules", { recursive: true });

  // If the 'no-bugs' rule eixsts
  // don't overwrite it
  if (!(await exists(join(".rules", "no-bugs.md")))) {
    // Add a markdown file called "no-bugs.md"
    await Deno.writeTextFile(
      join(".rules", "no-bugs.md"),
      "don't approve obvious bugs."
    );
  }

  // Get access token to see if they're logged in
  const config = await readConfig();
  const accessToken = config.accessToken;

  if (!accessToken) {
    // Print out an instruction to login
    console.log(`You're ready to go! Try running:
  rules login
  rules check`);
    return;
  }

  // Print out an instruction to login and then run rules check
  console.log(`You're ready to go! Try running:
  rules check`);
}
