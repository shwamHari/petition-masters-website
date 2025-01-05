import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as schemas from '../resources/schemas.json';
import Ajv from 'ajv';
import * as EmailValidator from "email-validator";
const ajv = new Ajv({removeAdditional: 'all', strict: false});
import * as petition from "../models/petition.model";
import * as user from "../models/user.model";
import * as support_tier from "../models/petition.support_tier.model";


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

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.support_tier_post,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

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

        const supportTiers = await petition.getSupportTiers(id);

        if (supportTiers.length === 3) {
            res.statusMessage = `Forbidden. Can't add a support tier if 3 already exist`;
            res.status(403).send()
            return;
        }

        for (const tier of supportTiers) {
            if (tier.title === req.body.title) {
                res.statusMessage = `Forbidden. Support title not unique within petition.`
                res.status(403).send();
                return;
            }
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

        if (resultUser[0].id !== resultPetition[0].owner_id) {
            res.statusMessage = 'Forbidden. Only the owner of a petition may modify it.';
            res.status(403).send();
            return;
        }



        await petition.postSupportTier(req.body, id);
        res.statusMessage = 'OK.';
        res.status(201).send();





    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.support_tier_patch,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }

        let tierId;
        tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
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

        const supportTiers = await petition.getSupportTiers(id);

        let tierExists = false;
        for (const tier of supportTiers) {
            if (tier.id === tierId) {
                tierExists = true;
            }
        }
        if (!tierExists) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }
        if (req.body.title) {
            for (const tier of supportTiers) {
                if (tier.title === req.body.title) {
                    res.statusMessage = `Forbidden. Support title not unique within petition.`
                    res.status(403).send();
                    return;
                }
            }
        }


        const supporterExists = await support_tier.getSupportTierSupporters(id, tierId);

        if (supporterExists.length > 0) {
            res.statusMessage = 'Forbidden. Can not edit a support tier if a supporter already exists for it.';
            res.status(403).send();
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

        if (resultUser[0].id !== resultPetition[0].owner_id) {
            res.statusMessage = 'Forbidden. Only the owner of a petition may modify it.';
            res.status(403).send();
            return;
        }

        await support_tier.patchSupportTier(req.body, tierId);
        res.statusMessage = 'OK.';
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send()
            return;
        }

        let tierId;
        tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send()
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }

        const supportTiers = await petition.getSupportTiers(id);

        if (supportTiers.length === 1) {
            res.statusMessage = 'Forbidden. Can not remove a support tier if it is the only one for a petition.';
            res.status(403).send();
            return;
        }

        let tierExists = false;
        for (const tier of supportTiers) {
            if (tier.id === tierId) {
                tierExists = true;
            }
        }
        if (!tierExists) {
            res.statusMessage = `Not Found.`;
            res.status(404).send()
            return;
        }

        const supporterExists = await support_tier.getSupportTierSupporters(id, tierId);

        if (supporterExists.length > 0) {
            res.statusMessage = 'Forbidden. Can not delete a support tier if a supporter already exists for it.';
            res.status(403).send();
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

        if (resultUser[0].id !== resultPetition[0].owner_id) {
            res.statusMessage = 'Forbidden. Only the owner of a petition may delete it.';
            res.status(403).send();
            return;
        }

        await support_tier.remove(id, tierId);
        res.statusMessage = 'OK.';
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};