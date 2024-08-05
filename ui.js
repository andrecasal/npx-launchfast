import color from "picocolors";
import isUnicodeSupported from "is-unicode-supported";

const unicode = isUnicodeSupported();
const s = (c, fallback) => (unicode ? c : fallback);
const S_STEP_SUBMIT = s("◇", "o");
const S_BAR = s("│", "|");
const S_BAR_H = s("─", "-");
const S_CORNER_TOP_RIGHT = s("╮", "+");
const S_CONNECT_LEFT = s("├", "+");
const S_CORNER_BOTTOM_RIGHT = s("╯", "+");

// Extension of the prompts to allow for a multiline message
const strip = (str) => str.replace(ansiRegex(), "");
export const note = (message = "", title = "") => {
   const lines = `\n${message}\n`.split("\n");
   const len =
      Math.max(
         lines.reduce((sum, ln) => {
            ln = strip(ln);
            return ln.length > sum ? ln.length : sum;
         }, 0),
         strip(title).length
      ) + 2;
   const msg = lines.map((ln) => `${color.gray(S_BAR)}  ${color.dim(ln)}${" ".repeat(len - strip(ln).length)}${color.gray(S_BAR)}`).join("\n");
   process.stdout.write(`${color.gray(S_BAR)}\n${color.green(S_STEP_SUBMIT)}  ${color.reset(title)} ${color.gray(S_BAR_H.repeat(Math.max(len - title.length - 1, 1)) + S_CORNER_TOP_RIGHT)}\n${msg}\n${color.gray(S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`);
};

function ansiRegex() {
   const pattern = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");

   return new RegExp(pattern, "g");
}
