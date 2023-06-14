// @ts-nocheck

/**
 * A port of gitdiff-parser to deno
 *
 * @file gitdiff 消息解析器
 * @author errorrik(errorrik@gmail.com)
 */

var STAT_START = 2;
var STAT_FILE_META = 3;
var STAT_HUNK = 5;

function parsePathFromFirstLine(line) {
  var filesStr = line.slice(11);
  var oldPath = null;
  var newPath = null;

  var quoteIndex = filesStr.indexOf('"');
  switch (quoteIndex) {
    case -1:
      var segs = filesStr.split(" ");
      oldPath = segs[0].slice(2);
      newPath = segs[1].slice(2);
      break;

    case 0:
      var nextQuoteIndex = filesStr.indexOf('"', 2);
      oldPath = filesStr.slice(3, nextQuoteIndex);
      var newQuoteIndex = filesStr.indexOf('"', nextQuoteIndex + 1);
      if (newQuoteIndex < 0) {
        newPath = filesStr.slice(nextQuoteIndex + 4);
      } else {
        newPath = filesStr.slice(newQuoteIndex + 3, -1);
      }
      break;

    default:
      var segs = filesStr.split(" ");
      oldPath = segs[0].slice(2);
      newPath = segs[1].slice(3, -1);
      break;
  }

  return {
    oldPath: oldPath,
    newPath: newPath,
  };
}

export type ChangeType = "insert" | "delete" | "normal";

export interface InsertChange {
  type: "insert";
  content: string;
  lineNumber: number;
  isInsert: true;
}

export interface DeleteChange {
  type: "delete";
  content: string;
  lineNumber: number;
  isDelete: true;
}

export interface NormalChange {
  type: "normal";
  content: string;
  isNormal: true;
  oldLineNumber: number;
  newLineNumber: number;
}

export type Change = InsertChange | DeleteChange | NormalChange;

export interface Hunk {
  content: string;
  oldStart: number;
  newStart: number;
  oldLines: number;
  newLines: number;
  changes: Change[];
}

export type FileType = "add" | "delete" | "modify" | "rename" | "copy";

export interface File {
  hunks: Hunk[];
  oldEndingNewLine: boolean;
  newEndingNewLine: boolean;
  oldMode: string;
  newMode: string;
  similarity?: number;
  oldRevision: string;
  newRevision: string;
  oldPath: string;
  newPath: string;
  isBinary?: boolean;
  type: FileType;
}

export const gitdiff = {
  /**
   * 解析 gitdiff 消息
   *
   * @param {string} source gitdiff消息内容
   * @return {Object}
   */
  parse: function (source: string): File[] {
    var infos = [];
    var stat = STAT_START;
    var currentInfo;
    var currentHunk;
    var changeOldLine;
    var changeNewLine;
    var paths;

    var lines = source.split("\n");
    var linesLen = lines.length;
    var i = 0;

    while (i < linesLen) {
      var line = lines[i];

      if (line.indexOf("diff --git") === 0) {
        // read file
        paths = parsePathFromFirstLine(line);
        currentInfo = {
          hunks: [],
          oldEndingNewLine: true,
          newEndingNewLine: true,
          oldPath: paths.oldPath,
          newPath: paths.newPath,
        };

        infos.push(currentInfo);

        // 1. 如果oldPath是/dev/null就是add
        // 2. 如果newPath是/dev/null就是delete
        // 3. 如果有 rename from foo.js 这样的就是rename
        // 4. 如果有 copy from foo.js 这样的就是copy
        // 5. 其它情况是modify
        var currentInfoType = null;

        // read type and index
        var simiLine;
        simiLoop: while ((simiLine = lines[++i])) {
          var spaceIndex = simiLine.indexOf(" ");

          var infoType =
            spaceIndex > -1 ? simiLine.slice(0, spaceIndex) : infoType;

          switch (infoType) {
            case "diff": // diff --git
              i--;
              break simiLoop;

            case "deleted":
            case "new":
              var leftStr = simiLine.slice(spaceIndex + 1);
              if (leftStr.indexOf("file mode") === 0) {
                currentInfo[infoType === "new" ? "newMode" : "oldMode"] =
                  leftStr.slice(10);
              }
              break;

            case "similarity":
              currentInfo.similarity = parseInt(simiLine.split(" ")[2], 10);
              break;

            case "index":
              var segs = simiLine.slice(spaceIndex + 1).split(" ");
              var revs = segs[0].split("..");

              currentInfo.oldRevision = revs[0];

              currentInfo.newRevision = revs[1];

              if (segs[1]) {
                currentInfo.oldMode = currentInfo.newMode = segs[1];
              }
              break;

            case "copy":
            case "rename":
              var infoStr = simiLine.slice(spaceIndex + 1);
              if (infoStr.indexOf("from") === 0) {
                currentInfo.oldPath = infoStr.slice(5);
              } else {
                // rename to
                currentInfo.newPath = infoStr.slice(3);
              }
              currentInfoType = infoType;
              break;

            case "---":
              var oldPath = simiLine.slice(spaceIndex + 1);
              var newPath = lines[++i].slice(4); // next line must be "+++ xxx"
              if (oldPath === "/dev/null") {
                newPath = newPath.slice(2);
                currentInfoType = "add";
              } else if (newPath === "/dev/null") {
                oldPath = oldPath.slice(2);
                currentInfoType = "delete";
              } else {
                currentInfoType = "modify";
                oldPath = oldPath.slice(2);
                newPath = newPath.slice(2);
              }

              if (oldPath) {
                currentInfo.oldPath = oldPath;
              }
              if (newPath) {
                currentInfo.newPath = newPath;
              }
              stat = STAT_HUNK;
              break simiLoop;
          }
        }

        currentInfo.type = currentInfoType || "modify";
      } else if (line.indexOf("Binary") === 0) {
        currentInfo.isBinary = true;

        currentInfo.type =
          line.indexOf("/dev/null and") >= 0
            ? "add"
            : line.indexOf("and /dev/null") >= 0
            ? "delete"
            : "modify";
        stat = STAT_START;
        currentInfo = null;
      } else if (stat === STAT_HUNK) {
        if (line.indexOf("@@") === 0) {
          var match =
            /^@@\s+-([0-9]+)(,([0-9]+))?\s+\+([0-9]+)(,([0-9]+))?/.exec(line);
          currentHunk = {
            content: line,

            oldStart: match[1] - 0,

            newStart: match[4] - 0,

            oldLines: match[3] - 0 || 1,

            newLines: match[6] - 0 || 1,
            changes: [],
          };

          currentInfo.hunks.push(currentHunk);
          changeOldLine = currentHunk.oldStart;
          changeNewLine = currentHunk.newStart;
        } else {
          var typeChar = line.slice(0, 1);
          var change = {
            content: line.slice(1),
          };

          switch (typeChar) {
            case "+":
              change.type = "insert";
              change.isInsert = true;
              change.lineNumber = changeNewLine;
              changeNewLine++;
              break;

            case "-":
              change.type = "delete";
              change.isDelete = true;
              change.lineNumber = changeOldLine;
              changeOldLine++;
              break;

            case " ":
              change.type = "normal";
              change.isNormal = true;
              change.oldLineNumber = changeOldLine;
              change.newLineNumber = changeNewLine;
              changeOldLine++;
              changeNewLine++;
              break;

            case "\\": // Seems "no newline" is the only case starting with /
              var lastChange =
                currentHunk.changes[currentHunk.changes.length - 1];
              if (!lastChange.isDelete) {
                currentInfo.newEndingNewLine = false;
              }
              if (!lastChange.isInsert) {
                currentInfo.oldEndingNewLine = false;
              }
          }

          change.type && currentHunk.changes.push(change);
        }
      }

      i++;
    }

    return infos;
  },
};
