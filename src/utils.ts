import { readFile, writeFile, readdir } from 'fs/promises'
import { Animal, NameAndID } from './interfaces.js'
import chalk from 'chalk'

export async function readAllJsonFilesInDir<T>(dirPath: string): Promise<T[]> {
  const files: string[] = await readdir(dirPath)
  const jsonFiles: string[] = files.filter(file => file.endsWith('.json'))

  const results: T[] = []

  for (const file of jsonFiles) {
    const filePath: string = `${dirPath}/${file}`
    const fileContent: string = await readFile(filePath, 'utf-8')
    results.push(JSON.parse(fileContent))
  }

  return results; // Array of parsed JSON objects
}

export async function readJsonFile(filePath: string): Promise<Record<string, any>[]>  {
  const fileContent = await readFile(filePath, 'utf-8')
    return JSON.parse(fileContent)
}

export async function writeToJsonFile(filePath: string, data: Record<string, any>): Promise<void>  {
  const jsonString: string = JSON.stringify(data, null, 2) // Pretty print with 2 spaces
  await writeFile(filePath, jsonString, 'utf-8')
}

export function formatAndColorJSON(obj: Record<string, any>): string {

  const formatted: string = JSON.stringify(obj, null, 2)

  // Step 1: Color string values in key-value pairs (but not keys)
  let colored: string = formatted.replace(/: "([^"]+)"/g, (_, val) => {
    return `: ${chalk.green(`"${val}"`)}`
  })

  // Step 2: Color strings in arrays (but not keys or objects)
  colored = colored.replace(/^(\s*)"(.*?)"(,?)$/gm, (match, space, val, comma) => {
    if (match.includes(':')) return match;
    return `${space}${chalk.green(`"${val}"`)}${comma}`;
  })

  // Step 3: Color numbers
  colored = colored.replace(/: (\d+(\.\d+)?)/g, (_, num) => {
    return `: ${chalk.yellow(num)}`;
  })

  return colored;
}

export function extractAnimalNameAndId(objects: Animal[]): NameAndID[] {
  return objects
      .map(obj => ({
          name: String(obj.name),  // Convert to string for safety
          id: String(obj.id)        
      }));
}