/**
 * Dedents strings based on the first non-empty line contained within. Lines with less indentation
 * than the first non-empty line are indented at least as much as that line (which is different to
 * what other libraries like [dedent](https://www.npmjs.com/package/dedent) do).
 *
 * This also applies to expression whitespace.
 *
 * @param string the string
 * @returns the dedented string
 */
export function dedent(string: string): string {
    // Trim newline whitespace in the front and all whitespace in the back.
    const lines = string
        .replace(/^(\s*\n)*/, "")
        .trimEnd()
        .split("\n");
    const indents = lines.map((line) => line.length - line.trimStart().length);
    const baseIndent = indents[0];
    const dedentedLines: string[] = [];
    let lastTrueIndent = 0;
    lines.forEach((line, i) => {
        let indentLength = 0;
        let indent = "";
        if (i > 0) {
            if (indents[i] < baseIndent) {
                indentLength = indents[lastTrueIndent] + indents[i] - baseIndent;
            } else {
                lastTrueIndent = i;
                indentLength = indents[i] - baseIndent;
            }
            indent = " ".repeat(indentLength);
        }
        // Replace whitespace in the front with calculated indent, then trim all trailing
        // whitespace. Trimming after concatenation replaces blank lines with the empty string.
        dedentedLines.push(`${indent}${line.trimStart()}`.trimEnd());
    });
    return dedentedLines.join("\n").trim();
}
