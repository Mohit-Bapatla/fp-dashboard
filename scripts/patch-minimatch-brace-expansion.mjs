import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const minimatchPackagePath = resolve(
  "node_modules",
  "minimatch",
  "package.json",
);
const minimatchSourcePath = resolve(
  "node_modules",
  "minimatch",
  "minimatch.js",
);
const legacyImport = "var expand = require('brace-expansion')";
const compatibleImport = "var expand = require('brace-expansion').expand";

const minimatchPackageSource = readFileSync(minimatchPackagePath, "utf8");
const minimatchPackage = JSON.parse(minimatchPackageSource);

if (minimatchPackage.version !== "3.1.5") {
  throw new Error(
    `Refusing to patch unexpected minimatch version ${minimatchPackage.version}`,
  );
}

const braceExpansionRange = minimatchPackage.dependencies?.["brace-expansion"];

if (braceExpansionRange !== "^1.1.7" && braceExpansionRange !== "5.0.8") {
  throw new Error(
    `Refusing to patch unexpected brace-expansion range ${braceExpansionRange}`,
  );
}

if (braceExpansionRange === "^1.1.7") {
  minimatchPackage.dependencies["brace-expansion"] = "5.0.8";
  writeFileSync(
    minimatchPackagePath,
    `${JSON.stringify(minimatchPackage, null, 2)}\n`,
  );
}

const source = readFileSync(minimatchSourcePath, "utf8");

if (source.includes(compatibleImport)) {
  process.exit(0);
}

const matches = source.split(legacyImport).length - 1;

if (matches !== 1) {
  throw new Error(
    `Expected exactly one legacy brace-expansion import, found ${matches}`,
  );
}

writeFileSync(
  minimatchSourcePath,
  source.replace(legacyImport, compatibleImport),
);
