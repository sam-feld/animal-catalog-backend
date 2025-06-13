import { readFile, writeFile, readdir } from 'fs/promises';
import chalk from 'chalk';
export async function readAllJsonFilesInDir(dirPath) {
    const files = await readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    const results = [];
    for (const file of jsonFiles) {
        const filePath = `${dirPath}/${file}`;
        const fileContent = await readFile(filePath, 'utf-8');
        results.push(JSON.parse(fileContent));
    }
    return results; // Array of parsed JSON objects
}
export async function readJsonFile(filePath) {
    const fileContent = await readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
}
export async function writeToJsonFile(filePath, data) {
    const jsonString = JSON.stringify(data, null, 2); // Pretty print with 2 spaces
    await writeFile(filePath, jsonString, 'utf-8');
}
export function formatAndColorJSON(obj) {
    const formatted = JSON.stringify(obj, null, 2);
    // Step 1: Color string values in key-value pairs (but not keys)
    let colored = formatted.replace(/: "([^"]+)"/g, (_, val) => {
        return `: ${chalk.green(`"${val}"`)}`;
    });
    // Step 2: Color strings in arrays (but not keys or objects)
    colored = colored.replace(/^(\s*)"(.*?)"(,?)$/gm, (match, space, val, comma) => {
        if (match.includes(':'))
            return match;
        return `${space}${chalk.green(`"${val}"`)}${comma}`;
    });
    // Step 3: Color numbers
    colored = colored.replace(/: (\d+(\.\d+)?)/g, (_, num) => {
        return `: ${chalk.yellow(num)}`;
    });
    return colored;
}
export function extractAnimalNameAndId(objects) {
    return objects
        .map(obj => ({
        name: String(obj.name), // Convert to string for safety
        id: String(obj.id)
    }));
}
