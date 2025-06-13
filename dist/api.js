import express from 'express';
import cors from 'cors';
import { extractAnimalNameAndId } from './utils.js';
import { createAnimal, getAllAnimals, getOneAnimal, getAnimalsByUser } from './animals.js';
import { createJWT, checkAuthentication, getUserIdFromAuthToken, getUser } from './authManager.js';
const app = express();
const port = 3000;
// Use express.json() middleware to parse JSON bodies
app.use(express.json());
// Enable CORS for all routes
app.use(cors());
app.listen(port, () => {
    console.log(`Running server on port ${port}`);
});
app.get('/', (req, res) => {
    res.send('Hello World');
    return;
});
app.get('/animals', async (req, res) => {
    try {
        const animals = await getAllAnimals();
        // const formattedResult = formatAndColorJSON(animals)
        res.status(200).json(animals);
        return;
    }
    catch (error) {
        res.status(500).json({ error: error });
        return;
    }
});
app.get('/animals/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Check if the id is a valid string
        if (typeof id !== 'string') {
            res.status(400).json({ error: 'ID is undefined' });
            return;
        }
        // Check that the id a valid whole number
        const wholeNumberPattern = /^[+-]?\d+$/;
        const isWholeNumber = wholeNumberPattern.test(id);
        if (!isWholeNumber) {
            res.status(400).json({ error: "Invalid ID: Must be a whole number." });
            return;
        }
        const [found, result] = await getOneAnimal(id);
        // const formattedResult = formatAndColorJSON(result)
        if (found) {
            res.status(200).json(result);
            return;
        }
        else {
            res.status(404).json(result);
            return;
        }
    }
    catch (error) {
        res.status(500).json({ error: error });
        return;
    }
});
app.post('/animals', async (req, res) => {
    const authtoken = req.headers.token;
    const jsonstring = req.body.jsonString;
    // Check that inputs are valid string
    if (typeof authtoken !== 'string') {
        res.status(400).json({ error: 'Invalid or missing authtoken' });
        return;
    }
    if (typeof jsonstring !== 'string') {
        res.status(400).json({ error: 'Invalid or missing data' });
        return;
    }
    try {
        const [created, message] = await createAnimal(authtoken, jsonstring);
        if (created) {
            res.status(201).json(message);
            return;
        }
        else {
            if (message && 'error' in message && message.error === 'Unauthorized') {
                res.status(401).json(message);
                return;
            }
            else {
                res.status(400).json(message);
                return;
            }
        }
    }
    catch (error) {
        res.status(500).json({ error: error });
        return;
    }
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Check if the data is a valid string
    if (typeof username !== 'string') {
        res.status(400).json({ error: 'Invalid or missing usermame' });
        return;
    }
    if (typeof password !== 'string') {
        res.status(400).json({ error: 'Invalid or missing password' });
        return;
    }
    try {
        const [created, result] = await createJWT(username, password);
        if (created) {
            res.status(201).json(result);
            return;
        }
        else {
            res.status(401).json(result);
            return;
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error });
        return;
    }
});
app.get('/user', async (req, res) => {
    const { token } = req.headers;
    // Check if the data is a valid string
    if (typeof token !== 'string') {
        res.status(400).json({ error: 'Invalid or missing authtoken' });
        return;
    }
    try {
        const authenticated = checkAuthentication(token);
        if (!authenticated) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userId = getUserIdFromAuthToken(token);
        if (userId === null) {
            res.status(400).json({ error: 'User ID could not be retrieved from auth token' });
            return;
        }
        let [userFound, result] = await getUser(userId); // returns a user or an error message
        if (userFound) {
            const [animalsFound, animals] = await getAnimalsByUser(userId); // Returns animals or a "none found" message
            // Add the user's animals if they exist
            if (animalsFound) {
                const animalNameAndIDs = extractAnimalNameAndId(animals);
                result = result;
                result.animals = animalNameAndIDs;
            }
            res.status(200).json(result); // return the user
            return;
        }
        else {
            res.status(404).json(result); // return the error message
            return;
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
        return;
    }
});
