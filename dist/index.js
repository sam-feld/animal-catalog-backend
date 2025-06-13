import { formatAndColorJSON } from './utils.js';
import { createAnimal, getAllAnimals, getAnimalsByUser, getOneAnimal } from './animals.js';
import { createJWT, checkAuthentication, getUserIdFromAuthToken } from './authManager.js';
function hasMinimumArgs(args, count) {
    return args.length >= count && args.every(isString);
}
function isString(value) {
    return typeof value === 'string';
}
function exitWithError(message) {
    console.error(message);
    process.exit(1);
}
async function processAnimalCommand(args) {
    if (!hasMinimumArgs(args, 1)) {
        exitWithError("Error: Insufficient arguments. 'Animal' must be followed by an additional argument");
    }
    if (args[0] === "all") {
        return formatAndColorJSON(await getAllAnimals());
    }
    else if (args[0] === "one") {
        if (!hasMinimumArgs(args, 2)) {
            exitWithError("Error: Insufficient arguments. 'Animal one' must be followed by an additional argument");
        }
        const animalId = args[1];
        const [found, result] = await getOneAnimal(animalId);
        return formatAndColorJSON(result); // Result is either an animal or an error message
    }
    else if (args[0] === "create") {
        if (!hasMinimumArgs(args, 3)) {
            exitWithError("Error: Insufficient arguments. 'Animal create' must be followed by two additional arguments");
        }
        const authToken = args[1]; // The above if statement confirms that this exists
        const jsonString = args[2];
        const [created, message] = await createAnimal(authToken, jsonString);
        return message; // Success or error message
    }
    return `Unrecognized animal command: ${args[0]}`;
}
async function processLoginCommand(args) {
    if (!hasMinimumArgs(args, 2)) {
        exitWithError("Error: Insufficient arguments. 'login' must be followed by two additional arguments");
    }
    const username = args[0];
    const password = args[1]; // The above if statement confirms that this exists
    if (username && password) {
        const [found, result] = await createJWT(username, password); // Returns a jwt or an error
        return result;
    }
    else {
        console.error("Input is undefined.");
    }
}
async function processUserCommand(args) {
    if (!hasMinimumArgs(args, 1)) {
        exitWithError("Error: Insufficient arguments. 'user' must be followed by an auth token");
    }
    const authToken = args[0];
    const authenticated = checkAuthentication(authToken);
    if (!authenticated) {
        return 'invalid token';
    }
    const userId = getUserIdFromAuthToken(authToken);
    if (userId === null) {
        console.error("User ID could not be retrieved from auth token");
    }
    else {
        const [found, result] = await getAnimalsByUser(userId); // Returns animals or a "none found" message
        if (found) {
            const green = '\x1b[32m';
            const reset = '\x1b[0m';
            let resultString = '';
            const animals = result;
            for (const animal of animals) {
                resultString += `{ name: ${green}${animal.name}${reset}, id: ${green}${animal.id}${reset} }\n`;
            }
            return "You’ve added the following animals to the system:\n" + resultString;
        }
        return "You havn't added any animals to the system yet";
    }
}
async function main() {
    const args = process.argv.slice(2); // Skip node path and file path
    // Get user input
    // Check that input is defined
    if (args.length < 2 || !isString(args[0])) {
        console.error("Error: Insufficient arguments. Please provide at least two arguments.");
        process.exit(1);
    }
    const firstArg = args[0];
    const remainingArgs = args.slice(1);
    if (firstArg === "animals") {
        console.log(await processAnimalCommand(remainingArgs));
    }
    else if (firstArg === "login") {
        console.log(await processLoginCommand(remainingArgs));
    }
    else if (firstArg === "user") {
        console.log(await processUserCommand(remainingArgs));
    }
    else {
        console.log(`Unrecognized command: ${firstArg}`);
    }
}
main();
