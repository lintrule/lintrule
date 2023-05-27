import data from "./cli.json" assert { type: "json" };

export async function getLocalVersion() {
  return data.version;
}

export async function getRemoteVersion() {
  const response = await fetch("https://lintrule.com/cli.json");
  const result = await response.json();

  // If you can't find the new version, silently fail
  if (!result.version) {
    console.error("Failed to get version from lintrule.com");
    return data.version;
  }
  return result.version;
}
