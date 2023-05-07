import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { loginCmd } from "./cmds/login.ts";
import { checkCmd } from "./cmds/check.ts";

await new Command()
  .name("rules")
  .version("0.0.1")
  .description("The english test framework")
  .action(() => console.log("Help command goes here."))
  .command("check", "Check this repository against all rules.")
  .option("--host [host]", "A specific api deployment of lintrule")
  .action((options, ..._args) =>
    checkCmd({
      host: options.host?.toString() || "https://lintrule.com",
    })
  )
  .command("login", "Login to lintrule")
  .option("--host [host]", "A specific api deployment of lintrule")
  .action((options, ..._args) => {
    loginCmd({
      host: options.host?.toString() || "https://lintrule.com",
    });
  })
  .parse(Deno.args);
