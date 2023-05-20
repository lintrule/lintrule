import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { loginCmd } from "./cmds/login.ts";
import { checkCmd } from "./cmds/check.ts";
import { readVersion } from "./version.ts";
import { initCmd } from "./cmds/init.ts";
import { estimateBillingCommand } from "./cmds/estimate-billing.ts";
import { upgrade } from "./cmds/upgrade.ts";
import { secretsCreateCmd, secretsListCmd } from "./cmds/secrets.ts";

const version = await readVersion();

const billingCommand: any = new Command()
  .description("Manage billing")
  .action(() => billingCommand.showHelp())
  .command("estimate", "Estimate your invoice for this repository")
  .action(() => estimateBillingCommand());

const secretsCommand: any = new Command()
  .description("Manage secrets")
  .action(() => secretsCommand.showHelp())
  .command("create", "List all secrets")
  .option("--host [host]", "A specific api deployment of lintrule")
  .action((options) =>
    secretsCreateCmd({
      host: options.host?.toString() || "https://lintrule.com",
    })
  );

const cmd: any = new Command()
  .name("rules")
  .version(version)
  .description("The plain language test framework")
  .action(() => cmd.showHelp())
  .command("init", "Add a rules folder with a demo rule")
  .action(() => initCmd())
  .command("upgrade", "Upgrade lintrule to the latest version")
  .action(() => upgrade())
  .command("check", "Check this repository against all rules")
  .option("--host [host]", "A specific api deployment of lintrule")
  .option(
    "--secret [secret]",
    "A secret. You can also use the LINTRULE_SECRET environment variable"
  )
  .action((options, ..._args) =>
    checkCmd({
      host: options.host?.toString() || "https://lintrule.com",
      secret: options.secret?.toString(),
    })
  )
  .command("login", "Login to lintrule")
  .option("--host [host]", "A specific api deployment of lintrule")
  .action((options, ..._args) => {
    loginCmd({
      host: options.host?.toString() || "https://lintrule.com",
    });
  })
  .command("billing", billingCommand)
  .command("secrets", secretsCommand);

await cmd.parse(Deno.args);
