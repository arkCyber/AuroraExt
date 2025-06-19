import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 源文件路径
const sourceDir = path.join(__dirname, 'src', 'Wasm-Blockchain', 'wasm-crypto', 'pkg');
const targetDir = path.join(__dirname, 'build', 'chrome-mv3');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 要复制的文件
const files = ['wasm_crypto.js', 'wasm_crypto_bg.wasm'];

// 复制文件
files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} to ${targetPath}`);
    } else {
        console.error(`Source file not found: ${sourcePath}`);
    }
}); 