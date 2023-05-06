import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { login } from "./cmds/login.ts";
import { checkCmd } from "./cmds/check.ts";

await new Command()
  .name("rules")
  .version("0.0.1")
  .description("The english test framework")
  .action(() => console.log("Help command goes here."))
  .command("check", "Check this repository against all rules.")
  .option("--api-host [api-host]", "A specific api deployment of lintrule")
  .option(
    "--login-host [login-host]",
    "A specific login deployment of lintrule"
  )
  .action((options, ..._args) =>
    checkCmd({
      apiHost: options.apiHost?.toString() || "https://lintrule.deno.dev",
    })
  )
  .command("login", "Login to lintrule")
  .option("--login-host [login-host]", "A specific api deployment of lintrule")
  .action((options, ..._args) => {
    login({
      loginHost: options.loginHost?.toString() || "https://lintrule.com",
    });
  })
  .parse(Deno.args);
