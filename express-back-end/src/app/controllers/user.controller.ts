import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import Ajv from 'ajv';
import * as EmailValidator from 'email-validator';
import {hash} from "../services/passwords";

import * as user from '../models/user.model';
import {subscribe} from "node:diagnostics_channel";
import {getPool} from "../../config/db";
import randtoken from "rand-token";

const ajv = new Ajv({removeAdditional: 'all', strict: false});
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user with name: ${req.body.firstName} ${req.body.lastName}`)
    const validation = await validate(
        schemas.user_register,
        req.body);
    if (validation !== true || !EmailValidator.validate(req.body.email)) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const first = req.body.firstName;
    const last = req.body.lastName;
    const email = req.body.email;
    const password = await hash(req.body.password);
    try{
        const result = await user.insert(first, last, email, password);
        res.status(201).send({ "userId": result.insertId });
    } catch (err) {
        Logger.error(err.message);
        if (err.message.startsWith("Duplicate entry")) {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        } else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.user_login,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const email = req.body.email;
        const password = await hash(req.body.password);
        const authToken = randtoken.generate(16);

        const result = await user.login(email, password, authToken);

        if (result.changedRows < 1) {
            res.statusMessage = `UnAuthorized. Incorrect email/password.`;
            res.status(401).send();
            return;
        } else {
            const resultUser = await user.checkUserAuth(authToken);

            res.status(200).send({ "userId": resultUser[0].id, "token": authToken });
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        const authKey = req.headers['x-authorization'];
        const result = await user.logout(Array.isArray(authKey) ? authKey[0] : authKey);
        if (result.changedRows < 1) {
            res.statusMessage = "UnAuthorized. Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        } else {
            res.statusMessage = "User logged out successfully";
            res.status(200).send();
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET single user id: ${req.params.id}`)
    let id;
    id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.statusMessage = "Bad request. Invalid information";
        res.status(400).send()
        return;
    }

    const authKey = req.headers['x-authorization'];
    try{
        const resultUser = await user.getOne(id);

        if (resultUser.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }

        const authenticatedUser = resultUser[0].auth_token === authKey;

        const responseData = {
            firstName: resultUser[0].first_name,
            lastName: resultUser[0].last_name,
        };

        if (authenticatedUser) {
            // @ts-ignore
            responseData.email = resultUser[0].email;
        }
        res.status(200).send(responseData);

    } catch (err) {
        if (err.message.startsWith('Unknown column')) {
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send();
        } else {
            Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        Logger.http(`PATCH update user ${req.params.id}`)

        const validation = await validate(
            schemas.user_edit,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send()
            return;
        }

        const resultUser = await user.getOne(id);

        if (resultUser.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        let authKey = req.headers['x-authorization'];
        if (Array.isArray(authKey)) {
            authKey = authKey[0]; // Get the first value
        }

        if (!authKey || authKey.trim() === '') {
            res.statusMessage = "Unauthorized or Invalid currentPassword";
            res.status(401).send();
            return;
        }

        if (resultUser[0].auth_token !== authKey) {
            res.statusMessage = "Forbidden. Can not edit another users information";
            res.status(403).send()
            return;
        }

        const updatedUser: User = {};
        const passwordProvided = req.body.password && req.body.currentPassword;
        if (passwordProvided) {
            if (req.body.currentPassword === req.body.password) {
                res.statusMessage = "Forbidden. Identical current and new passwords";
                res.status(403).send();
                return;
            }

            if (req.body.password.length < 6 || req.body.password.length > 64) {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }

            const hashedCurrentPassword = await hash(req.body.currentPassword);
            if (hashedCurrentPassword !== resultUser[0].password) {
                res.statusMessage = "Unauthorized or Invalid currentPassword";
                res.status(401).send();
                return;
            }

            updatedUser.password = await hash(req.body.password);
        } else {
            if (req.body.password !== undefined && req.body.password === "") {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.password = resultUser[0].password;
        }

        if (req.body.email) {
            if (!EmailValidator.validate(req.body.email)) {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            const emailExists = await user.checkEmail(req.body.email);
            if (emailExists.length > 0) {
                res.statusMessage = "Forbidden. Email is already in use";
                res.status(403).send();
                return;
            }
            updatedUser.email = req.body.email;
        } else {
            if (req.body.email !== undefined && req.body.email === "") {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.email = resultUser[0].email;
        }

        if (req.body.firstName) {
            if (typeof req.body.firstName !== 'string') {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            if (req.body.firstName.length < 1 || req.body.firstName.length > 64) {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.first_name = req.body.firstName;
        }
        else {
            if (req.body.firstName !== undefined && req.body.firstName === "") {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.first_name = resultUser[0].first_name;
        }

        if (req.body.lastName) {
            if (typeof req.body.lastName !== 'string') {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            if (req.body.lastName.length < 1 || req.body.lastName.length > 64) {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.last_name = req.body.lastName;
        } else {
            if (req.body.lastName !== undefined && req.body.lastName === "") {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.last_name = resultUser[0].last_name;
        }

        await user.edit(id, updatedUser);
        res.status(200).send('OK');
        return ;
    } catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {register, login, logout, view, update}