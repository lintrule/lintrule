import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { loginCmd } from "./cmds/login.ts";
import { checkCmd } from "./cmds/check/cmd.ts";
import { getLocalVersion, getRemoteVersion } from "./version.ts";
import { initCmd } from "./cmds/init.ts";
import { estimateBillingCommand } from "./cmds/estimate-billing.ts";
import { upgrade } from "./cmds/upgrade.ts";
import { secretsCreateCmd } from "./cmds/secrets.ts";
import * as semver from "https://deno.land/x/semver/mod.ts";
import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";

const remoteVersionPromise = getRemoteVersion();
const localVersionPromise = getLocalVersion();
const [remoteVersion, localVersion] = await Promise.all([
  remoteVersionPromise,
  localVersionPromise,
]);

if (semver.gt(remoteVersion, localVersion)) {
  console.log(
    colors.green(`
There's a new version of Lintrule available! (v${remoteVersion})

    ┌──────────────────────┐
    │ Run 'rules upgrade'  │
    └──────────────────────┘
`)
  );
}

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
  .version(localVersion)
  .description("The plain language test framework")
  .action(() => cmd.showHelp())
  .command("init", "Add a rules folder with a demo rule")
  .action(() => initCmd())
  .command("upgrade", "Upgrade lintrule to the latest version")
  .action(() => upgrade())
  .command("check", "Check this repository against all rules")
  .option("--m [message]", "A one-off rule to check.")
  .option("--files [path]", "If set, run on files instead of diffs")
  .option("--host [host]", "A specific api deployment of lintrule")
  .option(
    "--secret [secret]",
    "A secret. You can also use the LINTRULE_SECRET environment variable"
  )
  .option(
    "--diff [diff]",
    "Run rules only on changes between two files. Ex: 'HEAD^' or 'main..feature'"
  )
  .action((options, ..._args) => {
    return checkCmd({
      host: options.host?.toString() || "https://lintrule.com",
      secret: options.secret?.toString(),
      diff: options.diff?.toString(),
      message: options.m?.toString(),
      files: options.files === true ? "." : options.files?.toString(),
    });
  })
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
