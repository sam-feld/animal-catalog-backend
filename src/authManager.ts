import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { createHash } from 'crypto'
import { readAllJsonFilesInDir } from './utils.js'
import { UserPayload, User } from './interfaces.js'

// Load env variables
dotenv.config()

function sha256(input: string): string {
    // Convert input to Float64Array
  return createHash('sha256').update(input).digest('hex')
}

function getSecret(): string{

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return process.env.JWT_SECRET
}

async function getAllUsers(): Promise<User[]>  {

    const directory: string = './data/users'
    const users = await readAllJsonFilesInDir<User>(directory)
    return users as User[]

}

export async function getUser(userId: string): Promise<[boolean, User | { error: string }]>  {
  
  const allUsers: User[] = await getAllUsers()
  const user: User | undefined = allUsers.find(a => a.id === userId)
  return user ? [true, user] : [false, { error: 'User not found' }] 

}

export async function createJWT(username: string, password: string): Promise<[boolean, string | { error: string } ]> {

    const hash: string = sha256(username + ':' + password)

    const all_users: User[] = await getAllUsers()
    const user: undefined | User = all_users.find(a => a.hash === hash)

    if (user === undefined) {
        return [false, { error: 'Unauthorized' }] 
    }

    const token: string = jwt.sign({ id: user.id }, getSecret(), { expiresIn: '1h' })
    return [true, token]

}

export function checkAuthentication(authToken: string): boolean {

    try {
        const secret: string = getSecret()
        jwt.verify(authToken, secret)
        return true
    } catch (err) {
        return false
    }

  }

export function getUserIdFromAuthToken(authToken: string): string | null {

    try {
        const secret: string = getSecret();
        const payload = jwt.verify(authToken, secret) as UserPayload;
    
        // Check if the id field exists and convert to string if necessary
        if (payload && (typeof payload.id === 'string' || typeof payload.id === 'number')) {
          return String(payload.id)
        } else {
          throw new Error("Invalid token payload: ID not found.");
        }
      } catch (error) {
        console.error("Failed to verify auth token:", error)
        return null;  // Return null if verification fails
      }

}