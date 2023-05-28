export function countLines(str: string): number {
  let lines = 0;

  // Split the string by newline character
  const splitted = str.split("\n");

  // For each line, check its length
  for (let i = 0; i < splitted.length; i++) {
    const line = splitted[i];

    // If a line's length is more than 500, split it into multiple lines
    if (line.length > 500) {
      lines += Math.ceil(line.length / 500);
    } else {
      lines++;
    }
  }

  return lines;
}
