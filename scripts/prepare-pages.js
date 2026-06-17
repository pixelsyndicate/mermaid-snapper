const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const mermaidPackagePath = require.resolve('mermaid/package.json');
const mermaidDistDir = path.join(path.dirname(mermaidPackagePath), 'dist');
const sourcePath = path.join(mermaidDistDir, 'mermaid.min.js');
const targetDir = path.join(projectRoot, 'docs', 'vendor', 'mermaid');
const targetPath = path.join(targetDir, 'mermaid.min.js');

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Copied ${path.relative(projectRoot, sourcePath)} to ${path.relative(projectRoot, targetPath)}`);
