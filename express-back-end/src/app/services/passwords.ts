import {createHash} from "node:crypto";

const hash = async (password: string): Promise<string> => {
    const hasher = createHash('sha256');
    hasher.update(password)
    const hashedPassword = hasher.digest('hex');
    return hashedPassword
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    const passwordHash = await hash(password);
    return (passwordHash === comp)
}

export {hash, compare}