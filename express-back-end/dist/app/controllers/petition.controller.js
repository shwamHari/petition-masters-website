"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.deletePetition = exports.editPetition = exports.addPetition = exports.getPetition = exports.getAllPetitions = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const petition = __importStar(require("../models/petition.model"));
const user = __importStar(require("../models/user.model"));
const schemas = __importStar(require("../resources/schemas.json"));
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ removeAdditional: 'all', strict: false });
const validate = (schema, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validator = ajv.compile(schema);
        const valid = yield validator(data);
        if (!valid)
            return ajv.errorsText(validator.errors);
        return true;
    }
    catch (err) {
        return err.message;
    }
});
const getAllPetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validate(schemas.petition_search, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        if (req.query.startIndex !== undefined) {
            const startIndex = parseInt(req.query.startIndex, 10);
            if (isNaN(startIndex)) {
                res.statusMessage = 'Bad request. startIndex not a number.';
                res.status(400).send();
                return;
            }
        }
        if (req.query.q !== undefined) {
            if (!(typeof req.query.q === 'string') || req.query.q.trim() === '') {
                res.statusMessage = 'Bad request. q is not a string or q is empty.';
                res.status(400).send();
                return;
            }
        }
        if (req.query.categoryIds !== undefined) {
            if (Array.isArray(req.query.categoryIds)) {
                for (const cat of req.query.categoryIds) {
                    const valid = parseInt(cat, 10); // Parse each category ID
                    if (isNaN(valid)) {
                        res.statusMessage = 'Bad request. At least one categoryId is not a number.';
                        res.status(400).send();
                        return;
                    }
                }
            }
            else {
                const valid = parseInt(req.query.categoryIds, 10); // Parse each category ID
                if (isNaN(valid)) {
                    res.statusMessage = 'Bad request. At least one categoryId is not a number.';
                    res.status(400).send();
                    return;
                }
            }
        }
        if (req.query.supportingCost !== undefined) {
            const supportingCost = parseInt(req.query.supportingCost, 10);
            if (isNaN(supportingCost)) {
                res.statusMessage = 'Bad request. supportingCost not a number';
                res.status(400).send();
                return;
            }
        }
        if (req.query.ownerId !== undefined) {
            const ownerId = parseInt(req.query.ownerId, 10);
            if (isNaN(ownerId)) {
                res.statusMessage = 'Bad request. ownerId not a number';
                res.status(400).send();
                return;
            }
        }
        if (req.query.supporterId !== undefined) {
            const supporterId = parseInt(req.query.supporterId, 10);
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
            result = yield petition.getAllPetitions(req.query, sortBy);
        }
        else {
            result = yield petition.getAllPetitions(req.query);
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
            const startIndex = parseInt(req.query.startIndex, 10);
            if (req.query.count) {
                const count = parseInt(req.query.count, 10);
                returnPetitions = returnPetitions.slice(startIndex, startIndex + count);
            }
            else {
                returnPetitions = returnPetitions.slice(startIndex);
            }
        }
        else if (req.query.count) {
            const count = parseInt(req.query.count, 10);
            returnPetitions = returnPetitions.slice(0, count);
        }
        const finalResponse = {
            petitions: returnPetitions,
            count: petitionsCount
        };
        res.status(200).send(finalResponse);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllPetitions = getAllPetitions;
const getPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = 'Not Found. No petition with specified id.';
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = 'Not Found. No petition with specified id.';
            res.status(404).send();
            return;
        }
        const resultUser = yield user.getOne(resultPetition[0].owner_id);
        if (resultUser.length === 0) {
            res.statusMessage = "Not Found. No petition with ownerId";
            res.status(404).send();
            return;
        }
        const supporterCount = yield petition.getSupporterCount(id);
        const amountRaised = yield petition.getMoneyRaised(id);
        const supportTiersList = yield petition.getSupportTiers(id);
        const petitionSupportTiers = [];
        if (supportTiersList.length !== 0) {
            for (const supportTier of supportTiersList) {
                const newSupportTier = {
                    title: supportTier.title,
                    description: supportTier.description,
                    cost: supportTier.cost,
                    supportTierId: supportTier.id
                };
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
        };
        res.status(200).send(responsePetition);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getPetition = getPetition;
const addPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.http(`POST create a new petition`);
        const validation = yield validate(schemas.petition_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }
        const titleExists = yield petition.checkTitle(req.body.title);
        if (titleExists.length > 0) {
            res.statusMessage = `Petition title already exists.`;
            res.status(403).send();
            return;
        }
        const categoryExists = yield petition.checkCategory(req.body.categoryId);
        if (categoryExists.length === 0) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }
        const titlesSet = new Set();
        for (const tier of req.body.supportTiers) {
            if (titlesSet.has(tier.title)) {
                res.statusMessage = `Bad Request.`;
                res.status(400).send();
                return;
            }
            titlesSet.add(tier.title);
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = "Unauthorized.";
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
        if (resultUser.length === 0) {
            res.statusMessage = "Unauthorized.";
            res.status(401).send();
            return;
        }
        const resultOfPetition = yield petition.postPetition(req.body, resultUser[0].id);
        for (const tier of req.body.supportTiers) {
            const resultOfTierPost = yield petition.postSupportTier(tier, resultOfPetition.insertId);
        }
        res.status(201).send({ petitionId: resultOfPetition.insertId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addPetition = addPetition;
const editPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validate(schemas.petition_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request. Invalid information.`;
            res.status(400).send();
            return;
        }
        if (req.body.title) {
            const titleExists = yield petition.checkTitle(req.body.title);
            if (titleExists.length > 0) {
                res.statusMessage = `Petition title already exists.`;
                res.status(403).send();
                return;
            }
        }
        if (req.body.categoryId) {
            const categoryExists = yield petition.checkCategory(req.body.categoryId);
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
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = 'Not Found. No petition found with id';
            res.status(404).send();
            return;
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
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
        yield petition.patchPetition(req.body, id);
        res.statusMessage = 'OK';
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.editPetition = editPetition;
const deletePetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = 'Not Found. No petition found with id';
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = "Not Found. No petition with specified id.";
            res.status(404).send();
            return;
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
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
        const supporters = yield petition.checkIfSupporters(id);
        if (supporters.length > 0) {
            res.statusMessage = 'Forbidden. Can not delete a petition with one or more supporters';
            res.status(403).send();
            return;
        }
        yield petition.remove(id);
        res.statusMessage = 'OK';
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deletePetition = deletePetition;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield petition.getAllCategories();
        const responseCategories = [];
        for (const cat of result) {
            const nextCat = {
                categoryId: cat.id,
                name: cat.name
            };
            responseCategories.push(nextCat);
        }
        res.status(200).send(responseCategories);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getCategories = getCategories;
//# sourceMappingURL=petition.controller.js.map