import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';


const getAll = async (id: number): Promise<Supporter[]> => {
    Logger.info(`Getting information of supporters of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT supporter.id, support_tier_id, message, supporter.user_id, first_name, last_name, timestamp ' +
        'FROM supporter JOIN user on user.id = supporter.user_id where petition_id = ? order by timestamp desc';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
};

const insert = async (petitionId: number, tierId: number, userId: number, message?: any): Promise<ResultSetHeader> => {
    Logger.info(`Adding new supporter for petition ${petitionId} at tier ${tierId}`);
    const conn = await getPool().getConnection();
    const query = "insert into supporter (petition_id, support_tier_id, user_id, message) values ( ?, ?, ?, ? )";
    const [ rows ] = await conn.query( query, [petitionId, tierId, userId, message] );
    await conn.release();
    return rows;

}
export {getAll, insert}