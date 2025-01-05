import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';

const getSupportTierSupporters = async (id: number, tierId: number): Promise<Supporter[]> => {
    Logger.info(`checking if petition ${id} tier ${tierId} has any supporters`);
    const conn = await getPool().getConnection();
    const query = 'select * from supporter where petition_id = ? and support_tier_id = ?'
    const [ rows ] = await conn.query( query, [id, tierId] );
    await conn.release();
    return rows;
}

const patchSupportTier = async (params: any, id: number,): Promise<ResultSetHeader> => {
    Logger.info(`editing support tier ${id}`);
    const conn = await getPool().getConnection();
    let query = 'update support_tier set'
    if (params.title) {
        query +=  ' support_tier.title = "' + params.title + '",'
    }
    if (params.description) {
        query +=  ' support_tier.description = "' + params.description + '",'
    }
    if (params.cost) {
        query +=  ' support_tier.cost = ' + params.cost + ','
    }
    query = query.slice(0, -1);
    query += ` where id = ${id}`

    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const remove = async (id: number, tierId: number): Promise<ResultSetHeader> => {
    Logger.info(`deleting support tier ${id}`);
    const conn = await getPool().getConnection();
    const query = 'delete from support_tier where id = ? and petition_id = ?';
    const [ result ] = await conn.query( query, [ tierId, id ] );
    await conn.release();
    return result;
}

export {getSupportTierSupporters, patchSupportTier, remove}