import * as colors from "https://deno.land/std@0.185.0/fmt/colors.ts";
import { readConfig } from "../config.ts";

export async function secretsCreateCmd(props: {
  host: string;
  label?: string;
  secret?: string;
}) {
  const config = await readConfig();
  const accessToken = props.secret || config.accessToken;
  if (!accessToken) {
    console.error("Please run 'rules login' first.");
    Deno.exit(1);
  }

  const result = await fetch(`${props.host}/api/secrets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify({
      label: props.label || "Created at " + new Date().toISOString(),
    }),
  });

  if (!result.ok) {
    const text = await result.text();
    throw new Error(`Failed to create secret: ${text} ${result.status}`);
  }

  const json = (await result.json()) as {
    object: "access_token";
    token: string;
    label: string;
  };

  console.log(`
  ${colors.brightGreen("Secret created!")} 

  ${colors.bold("Label:")}  ${json.label}
  ${colors.bold("Secret:")} ${json.token}

  ${colors.dim("# Usage with environment variables")}
  export LINTRULE_SECRET=${json.token}
  rules check   

  ${colors.dim("# Usage with command line arguments")}
  rules check --secret ${json.token}\n`);
}

export async function secretsListCmd() {}
