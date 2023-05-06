import {
  walk,
  WalkEntry,
  WalkOptions,
} from "https://deno.land/std@0.115.0/fs/mod.ts";
import ignore from "./ignore.js";
import { relative } from "https://deno.land/std@0.185.0/path/mod.ts";

async function isTooLong(filePath: string, kbs: number): Promise<boolean> {
  const data = await Deno.readFile(filePath);

  return data.length > 1024 * kbs;
}

export async function* walkTextFiles(
  root: string,
  gitignorePath: string
): AsyncGenerator<WalkEntry> {
  const gitignoreContent = await Deno.readTextFile(gitignorePath);

  const walkOptions: WalkOptions = {};

  // gitignore content to lines
  const ignoreLines = gitignoreContent.split("\n");
  const ig = ignore()
    .add(ignoreLines)
    .addPattern("*.lock") // ignore lock files
    .addPattern("*.log") // ignore log files
    .addPattern("*.jpeg") // ignore jpegs
    .addPattern("*.jpg") // ignore jpgs
    .addPattern("*.png") // ignore pngs
    .addPattern("*.gif") // ignore gifs
    .addPattern("*.mp4") // ignore mp4s
    .addPattern("*.mp3") // ignore mp3s
    .addPattern("*.wav") // ignore wavs
    .addPattern("*.ogg") // ignore oggs
    .addPattern("*.webm") // ignore webms
    .addPattern("*.mov") // ignore movs
    .addPattern("*.avi") // ignore avis
    .addPattern("*.mkv") // ignore mkvs
    .addPattern("*.flv") // ignore flvs
    .addPattern("*.wmv") // ignore wmvs
    .addPattern("*.m4v") // ignore m4vs
    .addPattern("*.m4a") // ignore m4as
    .addPattern("*.flac") // ignore flacs
    .addPattern("*.opus") // ignore opuses
    .addPattern("*.zip") // ignore zips
    .addPattern("*.tar") // ignore tars
    .addPattern("*.gz") // ignore gzs
    .addPattern("*.7z") // ignore 7zs
    .addPattern("*.rar") // ignore rars
    .addPattern("*.pdf") // ignore pdfs
    .addPattern("*.doc") // ignore docs
    .addPattern("*.docx") // ignore docxs
    .addPattern("*.xls") // ignore xls
    .addPattern("*.xlsx") // ignore xlsx
    .addPattern("*.ppt") // ignore ppt
    .addPattern("*.pptx"); // ignore pptx

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

    if (await isTooLong(entry.path, 40)) {
      console.warn("Skipping file because it is too big:", entry.path);
      continue;
    }

    yield entry;
  }
}
