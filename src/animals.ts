
import { readAllJsonFilesInDir, writeToJsonFile } from './utils.js'
import { checkAuthentication, getUserIdFromAuthToken } from './authManager.js'
import { randomUUID } from 'crypto'
import { Animal } from './interfaces.js'

export function JsonIsValidAnimal(jsonObject: Animal): [boolean, null | { error: string } ] {
    // Check for required top-level fields
    const requiredFields = ['name', 'sciName', 'description', 'images', 'events']
    for (const field of requiredFields) {
      if (!(field in jsonObject)) return [false, { error: `invalid ${field}: must exist`}]
    }
  
    // name must be a non-empty string
    if (typeof jsonObject.name !== 'string' || jsonObject.name.trim().length < 1) {
      return [false, { error: 'invalid name: must have a length of at least 1'}]
    }

    // sciName must be a non-empty string
    if (typeof jsonObject.sciName !== 'string' || jsonObject.sciName.trim().length < 1) {
      return [false, { error: 'invalid sciName: must have a length of at least 1'}]
    }
  
    // description must be an array with at least 2 items
    if (!Array.isArray(jsonObject.description) || jsonObject.description.length < 2) {
      return [false, { error: 'invalid description: must contain at least 2 items'}]
    }
  
    // images must be a non-empty array
    if (!Array.isArray(jsonObject.images) || jsonObject.images.length < 1) {
      return [false, { error: 'invalid images: must not be empty'}]
    }
  
    // events must be a non-empty array
    if (!Array.isArray(jsonObject.events) || jsonObject.events.length < 1) {
      return [false, { error: 'invalid events: must not be empty'}]
    }
  
    // Regex to validate mm/dd/yyyy format
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/
  
    // Validate each event
    for (const event of jsonObject.events) {

      // Validate 'name'
      if (!('name' in event) || typeof event.name !== 'string' || event.name.trim().length < 1) {
        return [false, { error: 'invalid event: must contain a name'}]
      }

      // Validate 'date'
      if (!('date' in event) || typeof event.date !== 'string' || !dateRegex.test(event.date)) {
        return [false, { error: 'invalid event: must contain a date in the format mm/dd/yyyy'}]
      }

      // Validate 'url'
      if (!('url' in event) || typeof event.url !== 'string' || event.url.trim().length < 1) {
        return [false, { error: 'invalid event: must contain a url'}]
      }

    }
  
    return [true, null]
  }
  
  
  export async function addIdAndCreatedByUser(jsonObject: Animal , authToken: string): Promise<Animal> {
  
    jsonObject.id = await getNextAvailableInt()
    
    const userId: string | null = getUserIdFromAuthToken(authToken);

    if (userId !== null) {
        jsonObject.createdByUser = userId
    } else {
        throw new Error("User ID could not be retrieved from auth token")
    }
    
    return jsonObject
  
  }

  async function getNextAvailableInt(): Promise<string> {

    const allAnimals: Animal[] =  await getAllAnimals()
    const nextAvailableInt: number = allAnimals.length + 1
    return nextAvailableInt.toString()

  }
  
  export async function createAnimal(authToken: string, jsonString: string): Promise<[boolean, { error: string } | { success: string } | null ]> {
  
    const authenticated: boolean = checkAuthentication(authToken)
  
    if (authenticated) {
      
      let jsonObject: Animal

      try {
        jsonObject = JSON.parse(jsonString);
      } catch (error) {
        return [false, { error: 'Invalid JSON string' }]
      }

      const [isValid, error]: [boolean, null | { error: string } ] = JsonIsValidAnimal(jsonObject)
  
      if (isValid) {
  
        jsonObject = await addIdAndCreatedByUser(jsonObject, authToken)
  
        const directory: string = './data/animals'
        const filePath: string = `${directory}/${jsonObject.id}.json`
    
        writeToJsonFile(filePath, jsonObject)
        return [true, { success: 'Animal created' }]
  
  
      } else {
        
        return [false, error]

  
      }
  
    } else {

      return [false, { error: 'Unauthorized' }]

    }
  
  
  }
  
  export async function getAllAnimals(): Promise<Animal[]> {
  
    const directory: string = './data/animals'
    return await readAllJsonFilesInDir<Animal>(directory) 
  
  }
  
  export async function getOneAnimal(animalId: string): Promise<[boolean, Animal | { error: string }]>  {
  
    const all_animals: Animal[] = await getAllAnimals()
    const animal: Animal | undefined = all_animals.find(a => a.id === animalId)
    return animal ? [true, animal] : [false, { error: 'Animal not found' }] 

  }

  export async function getAnimalsByUser(userId: string): Promise<[boolean, Animal[] | { error: string }]> {

    const all_animals = await getAllAnimals()
    const animals = all_animals.filter(a => a.createdByUser === userId)
    
    return animals.length > 0
      ? [true, animals]
      : [false, { error: 'No animals found' }]

  }
  