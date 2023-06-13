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
      `Make sure our code follows these best practices, UNLESS there's a comment explaining why it's okay to break the rule.

1. Avoid typos.
2. Don't have like, really obvious bugs.
3. Don't store secrets in code.
4. Use a logging library, not console.log, print, etc.
5. Follow reasonable conventions of the language we're programming in. No need to be too strict.
6. Avoid dangerous stuff, like things that could lead to template injection, SQL injection, broken access control, or really anything that would show up as a CVE somewhere.`
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
