import data from "./cli.json" assert { type: "json" };

export async function readVersion() {
  return data.version;
}
