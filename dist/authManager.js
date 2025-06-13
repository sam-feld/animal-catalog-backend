import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import { readAllJsonFilesInDir } from './utils.js';
// Load env variables
dotenv.config();
function sha256(input) {
    // Convert input to Float64Array
    return createHash('sha256').update(input).digest('hex');
}
function getSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return process.env.JWT_SECRET;
}
async function getAllUsers() {
    const directory = './data/users';
    const users = await readAllJsonFilesInDir(directory);
    return users;
}
export async function getUser(userId) {
    const allUsers = await getAllUsers();
    const user = allUsers.find(a => a.id === userId);
    return user ? [true, user] : [false, { error: 'User not found' }];
}
export async function createJWT(username, password) {
    const hash = sha256(username + ':' + password);
    const all_users = await getAllUsers();
    const user = all_users.find(a => a.hash === hash);
    if (user === undefined) {
        return [false, { error: 'Unauthorized' }];
    }
    const token = jwt.sign({ id: user.id }, getSecret(), { expiresIn: '1h' });
    return [true, token];
}
export function checkAuthentication(authToken) {
    try {
        const secret = getSecret();
        jwt.verify(authToken, secret);
        return true;
    }
    catch (err) {
        return false;
    }
}
export function getUserIdFromAuthToken(authToken) {
    try {
        const secret = getSecret();
        const payload = jwt.verify(authToken, secret);
        // Check if the id field exists and convert to string if necessary
        if (payload && (typeof payload.id === 'string' || typeof payload.id === 'number')) {
            return String(payload.id);
        }
        else {
            throw new Error("Invalid token payload: ID not found.");
        }
    }
    catch (error) {
        console.error("Failed to verify auth token:", error);
        return null; // Return null if verification fails
    }
}
