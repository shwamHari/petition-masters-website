import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2';



const insert = async (first: string, last: string, email: string, password: string) : Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${first} ${last} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (first_name, last_name, email, password) values ( ?, ?, ?, ? )';
    const [ result ] = await conn.query( query, [ first, last, email, password ] );
    await conn.release();
    return result;
};

const login = async (email: string, password: string, authToken: string): Promise<ResultSetHeader> => {
    Logger.info(`logging in user ${email}`);
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token=? where email=? and password=?';
    const [ result ] = await conn.query( query, [authToken, email, password ] );
    await conn.release();
    return result;
};

const logout = async (authKey: string): Promise<ResultSetHeader> => {
    Logger.info(`logging out user`);
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = null where auth_token = ?';
    const [ result ] = await conn.query( query, [authKey] );
    await conn.release();
    return result;
};

const getOne = async (id: number, ): Promise<User[]> => {
    Logger.info(`Getting information of user ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
};

const checkEmail = async (email: string): Promise<User[]> => {
    Logger.info(`checking if email ${email} already exists`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where email = ?';
    const [ rows ] = await conn.query( query, [ email ] );
    await conn.release();
    return rows;
}

const edit = async (id: number, newUser: User): Promise<ResultSetHeader> => {
    Logger.info(`Updating information of user ${id}`);
    const conn = await getPool().getConnection();
    const query = 'update user set email = ?, first_name = ?, last_name = ?, password = ? where id = ?';
    const [ result ] = await conn.query( query, [newUser.email, newUser.first_name, newUser.last_name, newUser.password, id] );
    await conn.release();
    return result;
}

const checkUserAuth = async (authKey: string): Promise<User[]> => {
    Logger.info(`checking if user is authorized`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where auth_token = ?';
    const [ rows ] = await conn.query( query, [ authKey ] );
    await conn.release();
    return rows;
}

export {insert, login, logout, getOne, checkEmail, edit, checkUserAuth}