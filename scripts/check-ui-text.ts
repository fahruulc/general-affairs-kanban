import fs from "fs";
import path from "path";

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const DECORATIVE_SYMBOLS_REGEX = /[★☆✔✖✗✓❌➜➔➤►◄]/u;

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function checkUiText() {
  const srcDir = path.resolve(process.cwd(), "src");
  if (!fs.existsSync(srcDir)) {
    console.log("No src directory found to check yet.");
    process.exit(0);
  }

  const files = walkDir(srcDir);
  let hasErrors = false;

  console.log(`Checking ${files.length} files in src/ for emojis and decorative symbols...`);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Check emoji
      const emojiMatch = line.match(EMOJI_REGEX);
      const symbolMatch = line.match(DECORATIVE_SYMBOLS_REGEX);

      if (emojiMatch) {
        console.error(`[ERROR] Emoji found in ${file}:${index + 1} -> "${emojiMatch[0]}"`);
        hasErrors = true;
      }
      if (symbolMatch) {
        console.error(`[ERROR] Decorative symbol found in ${file}:${index + 1} -> "${symbolMatch[0]}"`);
        hasErrors = true;
      }
    });
  }

  if (hasErrors) {
    console.error("UI Text Check FAILED: Found disallowed emojis or decorative symbols.");
    process.exit(1);
  } else {
    console.log("UI Text Check PASSED: No emojis or decorative symbols found.");
    process.exit(0);
  }
}

checkUiText();
