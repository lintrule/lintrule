import {
  walk,
  WalkEntry,
  WalkOptions,
} from "https://deno.land/std@0.115.0/fs/mod.ts";
import ignore from "./ignore.js";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";
import { countLines } from "./loc.ts";

async function isTooBig(filePath: string, kbs: number): Promise<boolean> {
  const data = await Deno.readFile(filePath);

  return data.length > 1024 * kbs;
}

async function isBeyondMaxLines(
  filePath: string,
  maxLines: number
): Promise<boolean> {
  try {
    const data = await Deno.readTextFile(filePath);

    const lines = await countLines(data);
    return lines > maxLines;
  } catch (e) {
    return true;
  }
}

export const ignoredPatterns = [
  "package-lock.json", // ignore package-lock.json
  "yarn.lock", // ignore yarn.lock
  "node_modules", // ignore node_modules
  ".*", // ignore dot files
  "*.lock", // ignore lock files
  "*.log", // ignore log files
  "*.jpeg", // ignore jpegs
  "*.jpg", // ignore jpgs
  "*.png", // ignore pngs
  "*.gif", // ignore gifs
  "*.mp4", // ignore mp4s
  "*.mp3", // ignore mp3s
  "*.wav", // ignore wavs
  "*.ogg", // ignore oggs
  "*.webm", // ignore webms
  "*.mov", // ignore movs
  "*.avi", // ignore avis
  "*.mkv", // ignore mkvs
  "*.flv", // ignore flvs
  "*.wmv", // ignore wmvs
  "*.m4v", // ignore m4vs
  "*.m4a", // ignore m4as
  "*.flac", // ignore flacs
  "*.opus", // ignore opuses
  "*.zip", // ignore zips
  "*.tar", // ignore tars
  "*.gz", // ignore gzs
  "*.7z", // ignore 7zs
  "*.rar", // ignore rars
  "*.pdf", // ignore pdfs
  "*.doc", // ignore docs
  "*.docx", // ignore docxs
  "*.xls", // ignore xls
  "*.xlsx", // ignore xlsx
  "*.ppt", // ignore ppt
  "*.pptx", // ignore pptx
  "*.pyc", // ignore pycs
  "*.ipynb", // ignore ipynbs
  "*.whl", // ignore whls
  "*.o", // ignore os
  "*.a", // ignore as
  "*.so", // ignore sos
  "*.dylib", // ignore dylibs
  "*.exe", // ignore exes
  "*.dll", // ignore dlls
  "*.dmg", // ignore dmgs
  "*.iso", // ignore isos
  "*.bin", // ignore bins
  "*.csv", // ignore csvs
  "*.tsv", // ignore tsvs
  "*.dat", // ignore dats
  "*.db", // ignore dbs
  "*.sqlite", // ignore sqlites
  "*.dbf", // ignore dbfs
  "*.mdb", // ignore mdbs
  "*.ico", // ignore icos
];

export async function* walkTextFiles(
  root: string,
  gitignorePath: string
): AsyncGenerator<WalkEntry> {
  const gitignoreContent = await Deno.readTextFile(gitignorePath);

  const walkOptions: WalkOptions = {};

  // gitignore content to lines
  const ignoreLines = gitignoreContent.split("\n");
  const ig = ignore().add(ignoreLines).add(ignoredPatterns);

  for await (const entry of walk(root, walkOptions)) {
    // Ignore the .git folder
    if (entry.path.includes(".git")) {
      continue;
    }

    if (entry.isDirectory) {
      continue;
    }

    // Turn this into a relative path so it matches the gitignore
    // in deno
    if (ig.ignores(relative(root, entry.path))) {
      continue;
    }

    // This doesn't look like a code file!
    if (await isTooBig(entry.path, 100)) {
      console.warn(
        colors.red(`Skipping file because it is too big: ${entry.path}`)
      );
      continue;
    }

    if (await isBeyondMaxLines(entry.path, 5000)) {
      console.warn(
        colors.red(`Skipping file because it is too long: ${entry.path}`)
      );
      continue;
    }

    // If it's in the rules directory, skip it
    if (relative(root, entry.path).startsWith("rules")) {
      continue;
    }

    yield entry;
  }
}
