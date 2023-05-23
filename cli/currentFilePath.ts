export function currentFilePath() {
  // Get the URL of the current module
  const url = new URL(import.meta.url);

  // Get the pathname (this will still have a leading / on Windows)
  let path = url.pathname;

  // If on Windows, remove leading /
  if (Deno.build.os === "windows" && path.charAt(0) === "/") {
    path = path.substr(1);
  }

  return path;
}

export function currentFolder() {
  const path = currentFilePath();
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}
