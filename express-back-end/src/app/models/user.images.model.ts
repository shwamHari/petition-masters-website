import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';


const updateImage = async (id: number, newImageName: string): Promise<ResultSetHeader> => {
    Logger.info(`Updating profile picture of user ${id}`);
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = ? where id = ?';
    const [ result ] = await conn.query( query, [newImageName, id] );
    await conn.release();
    return result;
}

const deleteImage = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`deleting profile picture of user ${id}`);
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = null where id = ?';
    const [ result ] = await conn.query( query, [ id] );
    await conn.release();
    return result;
}


export {updateImage, deleteImage}