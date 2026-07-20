import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const result = spawnSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
});
if (result.status !== 0) {
  console.error("Unable to enumerate tracked files for secret scanning.");
  process.exit(1);
}

const patterns = [
  {
    label: "private key",
    value: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { label: "GitHub token", value: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { label: "AWS access key", value: /\bAKIA[A-Z0-9]{16}\b/ },
  { label: "Clerk secret key", value: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/ },
  {
    label: "long JWT",
    value: /\beyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
];
const binaryExtensions = /\.(?:gif|ico|jpe?g|pdf|png|webp|woff2?|zip)$/i;
const findings = [];

for (const file of result.stdout.split("\0").filter(Boolean)) {
  if (binaryExtensions.test(file)) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.value.test(text)) findings.push(`${file}: ${pattern.label}`);
  }
}

if (findings.length > 0) {
  console.error(
    "Potential committed secrets detected:\n" + findings.join("\n"),
  );
  process.exit(1);
}
console.log("No high-confidence secrets detected in tracked text files.");
