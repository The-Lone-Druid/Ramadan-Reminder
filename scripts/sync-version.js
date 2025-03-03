const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;
const [major, minor, patch] = version.split('.');
const versionCode = parseInt(major) * 10000 + parseInt(minor) * 100 + parseInt(patch);

// Update variables.gradle
const variablesPath = path.join(__dirname, '../android/variables.gradle');
let variablesContent = fs.readFileSync(variablesPath, 'utf8');

variablesContent = variablesContent.replace(
    /versionCode = \d+/,
    `versionCode = ${versionCode}`
);
variablesContent = variablesContent.replace(
    /versionName = "[^"]+"/,
    `versionName = "${version}"`
);

fs.writeFileSync(variablesPath, variablesContent);

console.log(`Updated Android version to ${version} (${versionCode})`); 