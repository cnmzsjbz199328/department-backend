import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');

export async function readJsonFile(filename) {
  const filePath = path.join(dataDir, filename);
  console.log(`Reading file: ${filePath}`);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function writeJsonFile(filename, data) {
  const filePath = path.join(dataDir, filename);
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}