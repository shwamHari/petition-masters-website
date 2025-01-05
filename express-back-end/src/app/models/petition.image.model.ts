import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';


const updateImage = async (id: number, newImageName: string): Promise<ResultSetHeader> => {
    Logger.info(`Updating hero picture of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'update petition set image_filename = ? where id = ?';
    const [ result ] = await conn.query( query, [newImageName, id] );
    await conn.release();
    return result;
}

export {updateImage}