import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';
import {getCategories} from "../controllers/petition.controller";

const getOne = async (id: number): Promise<Petition[]> => {
    Logger.info(`Getting information of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select * from petition where id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
};

const getSupporterCount = async (id: number): Promise<ResultSetHeader[]> => {
    Logger.info(`Getting support count of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select count(*) from supporter where petition_id = ?';
    const [ count ] = await conn.query( query, [ id ] );
    await conn.release();
    return count;
};

const getMoneyRaised = async (id: number): Promise<ResultSetHeader[]> => {
    Logger.info(`Getting money raised of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select sum(cost) from supporter join support_tier on support_tier.id = supporter.support_tier_id where supporter.petition_id = ?';
    const [ amount ] = await conn.query( query, [ id ] );
    await conn.release();
    return amount;
};

const getSupportTiers = async (id: number): Promise<SupportTier[]> => {
    Logger.info(`Getting support tiers of petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select * from support_tier where petition_id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
};

const getAllPetitions = async (params: any, order?: string): Promise<any[]> => {
    Logger.info(`Getting info on all requested petitions`);
    const conn = await getPool().getConnection();
    let query = 'SELECT petition.id, petition.title, category_id, owner_id, user.first_name, user.last_name, COUNT(supporter.id), creation_date, cost ' +
        'from petition join support_tier on support_tier.petition_id = petition.id JOIN user on petition.owner_id = user.id left join supporter on supporter.petition_id = petition.id ' +
        'WHERE(cost <= ALL(SELECT cost FROM support_tier WHERE petition_id = petition.id))';

    if (params.q) {
        query += " and (petition.title LIKE '%" + params.q + "%' OR petition.description LIKE '%" + params.q + "%')";
    }

    if (params.categoryIds && params.categoryIds.length > 0) {
        query += " and (category_id in (";
        for (const id of params.categoryIds) {
            query += `${id}, `;
        }
        query = query.slice(0, -2);
        query += "))";
    }

    if (params.supportingCost) {
        query += ` and (cost <= ${params.supportingCost})`
    }

    if (params.ownerId) {
        query += ` and (owner_id = ${params.ownerId})`
    }

    if (params.supporterId) {
        query += ` AND (exists (select * from supporter where petition_id = petition.id and user_id = ${params.supporterId}))`
    }
    query += ' GROUP BY petition.id ';

    if (order) {
        query += order + ', petition.id';
    } else {
        query += 'order by creation_date, petition.id';
    }

    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
};


const getAllCategories = async (): Promise<Category[]> => {
    Logger.info(`Getting categories information`);
    const conn = await getPool().getConnection();
    const query = 'select id, name from category order by name';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const checkTitle = async (title: string): Promise<ResultSetHeader[]> => {
    Logger.info(`checking if petition title ${title} exists`);
    const conn = await getPool().getConnection();
    const query = 'select * from petition where title = ?'
    const [ rows ] = await conn.query( query, [title] );
    await conn.release();
    return rows;

}

const checkCategory = async (id: number): Promise<ResultSetHeader[]> => {
    Logger.info(`checking if category id ${id} exists`);
    const conn = await getPool().getConnection();
    const query = 'select * from category where id = ?'
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const checkIfSupporters = async (id: number): Promise<ResultSetHeader[]> => {
    Logger.info(`checking if petition ${id} has any supporters`);
    const conn = await getPool().getConnection();
    const query = 'select * from supporter where petition_id = ?'
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const postPetition = async (params: any, userId: number): Promise<ResultSetHeader> => {
    Logger.info(`Creating new petition`);
    const conn = await getPool().getConnection();
    const query = "insert into petition (title, description, creation_date, owner_id, category_id) values ( ?, ?, current_date(), ?, ? )";
    const [ rows ] = await conn.query( query, [params.title, params.description, userId, params.categoryId] );
    await conn.release();
    return rows;

}

const patchPetition = async (params: any, id: number): Promise<ResultSetHeader> => {
    Logger.info(`editing petition ${id}`);
    const conn = await getPool().getConnection();
    let query = 'update petition set'
    if (params.title) {
        query +=  ' petition.title = "' + params.title + '",'
    }
    if (params.description) {
        query +=  ' petition.description = "' + params.description + '",'
    }
    if (params.categoryId) {
        query +=  ' petition.category_id = "' + params.categoryId + '",'
    }
    query = query.slice(0, -1);
    query += ` where id = ${id}`

    Logger.info(query);
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const postSupportTier = async (tier: any, petitionId: number): Promise<ResultSetHeader[]> => {
    Logger.info(`posting new support tier`);
    const conn = await getPool().getConnection();
    const query = 'insert into support_tier (petition_id, title, description, cost) values ( ?, ?, ?, ? )';
    const [ rows ] = await conn.query( query, [petitionId, tier.title, tier.description, tier.cost] );
    await conn.release();
    return rows;
}


const remove = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`deleting petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'delete from petition where id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}

export {
    getOne,
    getSupporterCount,
    getMoneyRaised,
    getSupportTiers,
    getAllPetitions,
    getAllCategories,
    checkTitle,
    checkCategory,
    checkIfSupporters,
    postPetition,
    patchPetition,
    postSupportTier,
    remove
}