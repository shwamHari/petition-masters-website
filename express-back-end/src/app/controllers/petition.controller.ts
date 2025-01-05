import {Request, response, Response} from "express";
import Logger from '../../config/logger';
import * as petition from "../models/petition.model";
import * as user from '../models/user.model'
import * as schemas from '../resources/schemas.json';
import Ajv from 'ajv';
import * as EmailValidator from "email-validator";

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

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.petition_search,
            req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }

        if (req.query.startIndex !== undefined) {
            const startIndex = parseInt(req.query.startIndex as string, 10);
            if (isNaN(startIndex)) {
                res.statusMessage = 'Bad request. startIndex not a number.';
                res.status(400).send();
                return;
            }
        }

        if (req.query.q !== undefined) {
            if (!(typeof req.query.q === 'string') || req.query.q.trim() === '') {
                res.statusMessage = 'Bad request. q is not a string or q is empty.';
                res.status(400).send()
                return;
            }
        }

        if (req.query.categoryIds !== undefined) {
            if (Array.isArray(req.query.categoryIds)) {
                for (const cat of req.query.categoryIds) {
                    const valid = parseInt(cat as string, 10); // Parse each category ID
                    if (isNaN(valid)) {
                        res.statusMessage = 'Bad request. At least one categoryId is not a number.';
                        res.status(400).send();
                        return;
                    }
                }
            } else {
                const valid = parseInt(req.query.categoryIds as string, 10); // Parse each category ID
                if (isNaN(valid)) {
                    res.statusMessage = 'Bad request. At least one categoryId is not a number.';
                    res.status(400).send();
                    return;
                }
            }
        }

        if (req.query.supportingCost !== undefined) {
            const supportingCost = parseInt(req.query.supportingCost as string, 10);
            if (isNaN(supportingCost)) {
                res.statusMessage = 'Bad request. supportingCost not a number';
                res.status(400).send();
                return;
            }
        }

        if (req.query.ownerId !== undefined) {
            const ownerId = parseInt(req.query.ownerId as string, 10);
            if (isNaN(ownerId)) {
                res.statusMessage = 'Bad request. ownerId not a number';
                res.status(400).send();
                return;
            }
        }

        if (req.query.supporterId !== undefined) {
            const supporterId = parseInt(req.query.supporterId as string, 10);
            if (isNaN(supporterId)) {
                res.statusMessage = 'Bad request. supporterId not a number';
                res.status(400).send();
                return;
            }
        }

        let result;

        if (req.query.sortBy !== undefined) {
            let sortBy;
            switch (req.query.sortBy) {
                case 'ALPHABETICAL_ASC':
                    sortBy = 'ORDER BY title ASC';
                    break;
                case 'ALPHABETICAL_DESC':
                    sortBy = 'ORDER BY title DESC';
                    break;
                case 'COST_ASC':
                    sortBy = 'ORDER BY cost ASC';
                    break;
                case 'COST_DESC':
                    sortBy = 'ORDER BY cost DESC';
                    break;
                case 'CREATED_ASC':
                    sortBy = 'ORDER BY creation_date ASC';
                    break;
                case 'CREATED_DESC':
                    sortBy = 'ORDER BY creation_date DESC';
                    break;
                default:
                    res.statusMessage = "Bad request. Invalid sortBy parameter";
                    res.status(400).send();
                    return;
            }
            result = await petition.getAllPetitions(req.query, sortBy);
        } else {
            result = await petition.getAllPetitions(req.query);
        }

        let returnPetitions = [];

        for (const pet of result) {
            const nextPet = {
                petitionId: pet.id,
                title: pet.title,
                categoryId: pet.category_id,
                ownerId: pet.owner_id,
                ownerFirstName: pet.first_name,
                ownerLastName: pet.last_name,
                numberOfSupporters: pet['COUNT(supporter.id)'],
                creationDate: pet.creation_date,
                supportingCost: pet.cost
            };
            returnPetitions.push(nextPet);
        }

        const petitionsCount = returnPetitions.length;

        if (req.query.startIndex) {
            const startIndex = parseInt(req.query.startIndex as string, 10);
            if (req.query.count) {
                const count = parseInt(req.query.count as string, 10);
                returnPetitions = returnPetitions.slice(startIndex, startIndex + count);
            } else {
                returnPetitions = returnPetitions.slice(startIndex);
            }
        } else if (req.query.count) {
            const count = parseInt(req.query.count as string, 10);
            returnPetitions = returnPetitions.slice(0, count);
        }

        const finalResponse = {
            petitions: returnPetitions,
            count: petitionsCount
        }

        res.status(200).send(finalResponse);
        return;


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = 'Not Found. No petition with specified id.';
            res.status(404).send()
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = 'Not Found. No petition with specified id.';
            res.status(404).send();
            return;
        }

        const resultUser = await user.getOne(resultPetition[0].owner_id);

        if (resultUser.length === 0) {
            res.statusMessage = "Not Found. No petition with ownerId";
            res.status(404).send();
            return;
        }

        const supporterCount = await petition.getSupporterCount(id);

        const amountRaised = await petition.getMoneyRaised(id);

        const supportTiersList = await  petition.getSupportTiers(id);

        const petitionSupportTiers  = [];

        if (supportTiersList.length !== 0) {
            for (const supportTier of supportTiersList) {
                const newSupportTier = {
                    title: supportTier.title,
                    description: supportTier.description,
                    cost: supportTier.cost,
                    supportTierId: supportTier.id
                }
                petitionSupportTiers.push(newSupportTier);
            }
        }

        const responsePetition = {
            petitionId: resultPetition[0].id,
            title: resultPetition[0].title,
            categoryId: resultPetition[0].category_id,
            ownerId: resultPetition[0].owner_id,
            ownerFirstName: resultUser[0].first_name,
            ownerLastName: resultUser[0].last_name,
            // @ts-ignore
            numberOfSupporters: parseInt(supporterCount[0]['count(*)'], 10),
            creationDate: resultPetition[0].creation_date,
            description: resultPetition[0].description,
            // @ts-ignore
            moneyRaised: parseInt(amountRaised[0]['sum(cost)'], 10),
            supportTiers: petitionSupportTiers
        }

        res.status(200).send(responsePetition);
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`POST create a new petition`)
        const validation = await validate(
            schemas.petition_post,
            req.body);

        if (validation !== true) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }
        const titleExists = await petition.checkTitle(req.body.title);

        if (titleExists.length > 0) {
            res.statusMessage = `Petition title already exists.`;
            res.status(403).send();
            return;
        }

        const categoryExists = await petition.checkCategory(req.body.categoryId);

        if (categoryExists.length === 0) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }

        const titlesSet = new Set<string>();
        for (const tier of req.body.supportTiers) {
            if (titlesSet.has(tier.title)) {
                res.statusMessage = `Bad Request.`
                res.status(400).send();
                return;
            }
            titlesSet.add(tier.title);
        }

        const authKey = req.headers['x-authorization'] as string;

        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = "Unauthorized.";
            res.status(401).send();
            return;
        }

        const resultUser = await user.checkUserAuth(authKey as string);
        if (resultUser.length === 0) {
            res.statusMessage = "Unauthorized.";
            res.status(401).send();
            return;
        }

        const resultOfPetition = await petition.postPetition(req.body, resultUser[0].id);

        for (const tier of req.body.supportTiers) {
            const resultOfTierPost = await petition.postSupportTier(tier, resultOfPetition.insertId)
        }

        res.status(201).send({petitionId: resultOfPetition.insertId});
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.petition_patch,
            req.body);

        if (validation !== true) {
            res.statusMessage = `Bad Request. Invalid information.`;
            res.status(400).send();
            return;
        }

        if (req.body.title) {
            const titleExists = await petition.checkTitle(req.body.title);
            if (titleExists.length > 0) {
                res.statusMessage = `Petition title already exists.`;
                res.status(403).send();
                return;
            }
        }

        if (req.body.categoryId) {
            const categoryExists = await petition.checkCategory(req.body.categoryId);

            if (categoryExists.length === 0) {
                res.statusMessage = `Bad Request.`;
                res.status(400).send();
                return;
            }
        }


        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = 'Not Found. No petition found with id';
            res.status(404).send();
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = 'Not Found. No petition found with id';
            res.status(404).send();
            return;
        }

        const authKey = req.headers['x-authorization'] as string;

        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        const resultUser = await user.checkUserAuth(authKey as string);
        if (resultUser.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        if (resultUser[0].id !== resultPetition[0].owner_id) {
            res.statusMessage = 'Forbidden. Only the owner of a petition may change it';
            res.status(403).send();
            return;
        }

        await petition.patchPetition(req.body, id);

        res.statusMessage = 'OK';
        res.status(200).send();
        return;


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = 'Not Found. No petition found with id';
            res.status(404).send();
            return;
        }

        const resultPetition = await petition.getOne(id);

        if (resultPetition.length === 0) {
            res.statusMessage = "Not Found. No petition with specified id.";
            res.status(404).send();
            return;
        }

        const authKey = req.headers['x-authorization'] as string;

        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        const resultUser = await user.checkUserAuth(authKey as string);
        if (resultUser.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        if (resultUser[0].id !== resultPetition[0].owner_id) {
            res.statusMessage = 'Forbidden. Only the owner of a petition may delete it';
            res.status(403).send();
            return;
        }

        const supporters = await petition.checkIfSupporters(id);
        if (supporters.length > 0) {
            res.statusMessage = 'Forbidden. Can not delete a petition with one or more supporters';
            res.status(403).send();
            return;
        }

        await petition.remove(id);
        res.statusMessage = 'OK';
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const result = await petition.getAllCategories();

        const responseCategories = [];

        for (const cat of result) {
            const nextCat = {
                categoryId: cat.id,
                name: cat.name
            }
            responseCategories.push(nextCat);
        }
        res.status(200).send(responseCategories);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};