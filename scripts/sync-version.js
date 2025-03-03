import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJson = require("../package.json");
const version = packageJson.version;
const [major, minor, patch] = version.split(".");
const versionCode =
  parseInt(major) * 10000 + parseInt(minor) * 100 + parseInt(patch);

// Update variables.gradle
const variablesPath = join(__dirname, "../android/variables.gradle");
let variablesContent = readFileSync(variablesPath, "utf8");

variablesContent = variablesContent.replace(
  /versionCode = \d+/,
  `versionCode = ${versionCode}`
);
variablesContent = variablesContent.replace(
  /versionName = "[^"]+"/,
  `versionName = "${version}"`
);

writeFileSync(variablesPath, variablesContent);

console.log(`Updated Android version to ${version} (${versionCode})`);
