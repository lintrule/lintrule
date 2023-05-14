import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { loginCmd } from "./cmds/login.ts";
import { checkCmd } from "./cmds/check.ts";
import { readVersion } from "./version.ts";
import { initCmd } from "./cmds/init.ts";
import { estimateBillingCommand } from "./cmds/estimate-billing.ts";
import { upgrade } from "./cmds/upgrade.ts";

const version = await readVersion();

const cmd: any = new Command()
  .name("rules")
  .version(version)
  .description("The plain language test framework")
  .action(() => cmd.showHelp())
  .command("init", "Add a rules folder with a demo rule")
  .action(() => initCmd())
  .command("check", "Check this repository against all rules")
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
  .command("estimate-billing", "Estimate your invoice for this repository")
  .action(() => estimateBillingCommand())
  .command("upgrade", "Upgrade lintrule to the latest version")
  .action(() => upgrade());

await cmd.parse(Deno.args);
