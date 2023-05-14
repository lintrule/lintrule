export async function upgrade() {
  const cmd = new Deno.Command("bash", {
    args: ["-c", "sh <(curl -s https://www.lintrule.com/install.sh)"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();

  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  console.log(new TextDecoder().decode(stdout));
  console.error(new TextDecoder().decode(stderr));
}
