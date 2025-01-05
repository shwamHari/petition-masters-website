import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petition from "../models/petition.model";
import * as supporter from "../models/petition.supporter.model"
import * as schemas from '../resources/schemas.json';
import Ajv from 'ajv';
import * as user from "../models/user.model";
import * as support_tier from "../models/petition.support_tier.model";



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

const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }

        const supporters = await supporter.getAll(id);

        const responseSupporters = [];

        for (const sup of supporters) {
            const nextSup = {
                supportId: sup.id,
                supportTierId: sup.support_tier_id,
                message: sup.message,
                supporterId: sup.user_id,
                supporterFirstName: sup.first_name,
                supporterLastName: sup.last_name,
                timestamp: sup.timestamp
            }
            responseSupporters.push(nextSup);
        }

        res.statusMessage = `OK.`;
        res.status(200).send(responseSupporters)
        return;


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.support_post,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send()
            return;
        }

        let tierId;
        tierId = parseInt(req.body.supportTierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send()
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found. No petition found with id.`;
            res.status(404).send()
            return;
        }

        const supportTiers = await petition.getSupportTiers(id);

        let tierExists = false;

        for (const tier of supportTiers) {
            if (tier.id === req.body.supportTierId) {
                tierExists = true;
            }
        }
        if (!tierExists) {
            res.statusMessage = `Not found. Support tier does not exist.`;
            res.status(404).send()
            return;
        }

        const authKey = req.headers['x-authorization'] as string;

        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized.';
            res.status(401).send();
            return;
        }

        const resultUser = await user.checkUserAuth(authKey as string);
        if (resultUser.length === 0) {
            res.statusMessage = 'Unauthorized.';
            res.status(401).send();
            return;
        }

        const supporters = await support_tier.getSupportTierSupporters(id, tierId);

        let alreadySupporting = false;

        for (const sup of supporters) {
            if (sup.user_id === resultUser[0].id) {
                alreadySupporting = true;
            }
        }

        if (alreadySupporting) {
            res.statusMessage = 'Forbidden. Already supported at this tier.';
            res.status(403).send();
            return;
        }

        if (resultPetition[0].owner_id === resultUser[0].id) {
            res.statusMessage = 'Forbidden. Cannot support your own petition.';
            res.status(403).send();
            return;
        }

        await supporter.insert(id, tierId, resultUser[0].id, req.body.message)
        res.statusMessage = 'Created.';
        res.status(201).send();
        return;



    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}