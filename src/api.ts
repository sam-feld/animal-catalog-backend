import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import { extractAnimalNameAndId, formatAndColorJSON } from './utils.js'
import { createAnimal, getAllAnimals, getOneAnimal, getAnimalsByUser } from './animals.js'
import { Animal, User, NameAndID } from './interfaces.js'
import { createJWT, checkAuthentication, getUserIdFromAuthToken, getUser } from './authManager.js'
import e from 'express'

const app: Express = express()
const port: number = 3000

// Use express.json() middleware to parse JSON bodies
app.use(express.json())

// Enable CORS for all routes
app.use(cors())

app.listen(port, (): void => {
    console.log(`Running server on port ${port}`)
})

app.get('/', (req: Request, res: Response): void => {
    res.send('Hello World')
    return
})

app.get('/animals', async (req: Request, res: Response): Promise<void> => {
    try {

        const animals: Animal[] = await getAllAnimals()
        // const formattedResult = formatAndColorJSON(animals)
        res.status(200).json(animals)
        return

    } catch (error) {
        res.status(500).json({ error: error })
        return
    }
})

app.get('/animals/:id', async (req: Request, res: Response): Promise<void> => {
  
    try {

        const id: string | undefined = req.params.id

        // Check if the id is a valid string
        if (typeof id !== 'string') {
            res.status(400).json({ error: 'ID is undefined' })
            return
        }

        // Check that the id a valid whole number
        const wholeNumberPattern = /^[+-]?\d+$/
        const isWholeNumber: boolean = wholeNumberPattern.test(id!)
        if (!isWholeNumber){
            res.status(400).json({ error: "Invalid ID: Must be a whole number." })
            return
        }

        const [found, result]: [boolean, Animal | { error: string }] = await getOneAnimal(id!)

        // const formattedResult = formatAndColorJSON(result)

        if(found){
            res.status(200).json(result)
            return
        } else {
            res.status(404).json(result)
            return
        }

    } catch (error) {
        res.status(500).json({ error: error })
        return
    }

})

app.post('/animals', async (req: Request, res: Response): Promise<void> => {
    
    const authtoken = req.headers.token as string

    const jsonstring: string = req.body.jsonString

    // Check that inputs are valid string
    if (typeof authtoken !== 'string' ) {
        res.status(400).json({ error: 'Invalid or missing authtoken' })
        return
    }
    if (typeof jsonstring !== 'string' ) {
        res.status(400).json({ error: 'Invalid or missing data' })
        return
    }


    try {
        const [created, message]: [boolean, { error: string } | { success: string } | null ] = await createAnimal(authtoken!, jsonstring!)
        
        if(created){
            res.status(201).json(message)
            return
        } else {

            if (message && 'error' in message && message.error === 'Unauthorized'){
                res.status(401).json(message)
                return
            } else {
                res.status(400).json(message)
                return
            } 
        }

    } catch (error) {
        res.status(500).json({ error: error })
        return
    }

})

app.post('/login', async (req: Request, res: Response): Promise<void> => {
    
    const { username, password } = req.body


    // Check if the data is a valid string
    if (typeof username !== 'string') {
        res.status(400).json({ error: 'Invalid or missing usermame' }) 
        return
    }
    if (typeof password !== 'string' ) {
        res.status(400).json({ error: 'Invalid or missing password' }) 
        return
    }

    try {
        const [created, result]: [boolean, string | { error: string } ] = await createJWT(username!, password!)

        if(created){
            res.status(201).json(result)
            return
        } else {
            res.status(401).json(result)
            return
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
        return
    }

})


app.get('/user', async (req: Request, res: Response): Promise<void> => {
    
    const { token } = req.headers

    // Check if the data is a valid string
    if (typeof token !== 'string') {
        res.status(400).json({ error: 'Invalid or missing authtoken' })
        return
    }

    try {
        
        const authenticated: boolean = checkAuthentication(token!)
        if (!authenticated){
            res.status(401).json({error: 'Unauthorized'})
            return
        }

        const userId: string | null = getUserIdFromAuthToken(token!)
        if (userId === null) {
            res.status(400).json({error: 'User ID could not be retrieved from auth token'})
            return
        }

        
        let [userFound, result]: [boolean, User | { error: string }] = await getUser(userId!) // returns a user or an error message

        if (userFound) {

            const [animalsFound, animals]: [boolean, Animal[] | { error: string }] = await getAnimalsByUser(userId!)// Returns animals or a "none found" message

            // Add the user's animals if they exist
            if (animalsFound) {

                const animalNameAndIDs: NameAndID[] = extractAnimalNameAndId( animals as Animal[] )
                result = result as User
                result.animals = animalNameAndIDs
            } 

            res.status(200).json(result) // return the user
                return

        } else {

            res.status(404).json(result) // return the error message
            return

        }



    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' })
        return
    }

})