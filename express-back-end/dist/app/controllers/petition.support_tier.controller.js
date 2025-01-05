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
exports.deleteSupportTier = exports.editSupportTier = exports.addSupportTier = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const schemas = __importStar(require("../resources/schemas.json"));
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ removeAdditional: 'all', strict: false });
const petition = __importStar(require("../models/petition.model"));
const user = __importStar(require("../models/user.model"));
const support_tier = __importStar(require("../models/petition.support_tier.model"));
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
const addSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validate(schemas.support_tier_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        const supportTiers = yield petition.getSupportTiers(id);
        if (supportTiers.length === 3) {
            res.statusMessage = `Forbidden. Can't add a support tier if 3 already exist`;
            res.status(403).send();
            return;
        }
        for (const tier of supportTiers) {
            if (tier.title === req.body.title) {
                res.statusMessage = `Forbidden. Support title not unique within petition.`;
                res.status(403).send();
                return;
            }
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized.';
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
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
        yield petition.postSupportTier(req.body, id);
        res.statusMessage = 'OK.';
        res.status(201).send();
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addSupportTier = addSupportTier;
const editSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validate(schemas.support_tier_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        let tierId;
        tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        const supportTiers = yield petition.getSupportTiers(id);
        let tierExists = false;
        for (const tier of supportTiers) {
            if (tier.id === tierId) {
                tierExists = true;
            }
        }
        if (!tierExists) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        if (req.body.title) {
            for (const tier of supportTiers) {
                if (tier.title === req.body.title) {
                    res.statusMessage = `Forbidden. Support title not unique within petition.`;
                    res.status(403).send();
                    return;
                }
            }
        }
        const supporterExists = yield support_tier.getSupportTierSupporters(id, tierId);
        if (supporterExists.length > 0) {
            res.statusMessage = 'Forbidden. Can not edit a support tier if a supporter already exists for it.';
            res.status(403).send();
            return;
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized.';
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
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
        yield support_tier.patchSupportTier(req.body, tierId);
        res.statusMessage = 'OK.';
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
exports.editSupportTier = editSupportTier;
const deleteSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }
        let tierId;
        tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = `Bad Request.`;
            res.status(400).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found.`;
            res.status(404).send();
            return;
        }
        const supportTiers = yield petition.getSupportTiers(id);
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
            res.status(404).send();
            return;
        }
        const supporterExists = yield support_tier.getSupportTierSupporters(id, tierId);
        if (supporterExists.length > 0) {
            res.statusMessage = 'Forbidden. Can not delete a support tier if a supporter already exists for it.';
            res.status(403).send();
            return;
        }
        const authKey = req.headers['x-authorization'];
        if (authKey === undefined || (authKey !== undefined && authKey.trim() === '')) {
            res.statusMessage = 'Unauthorized.';
            res.status(401).send();
            return;
        }
        const resultUser = yield user.checkUserAuth(authKey);
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
        yield support_tier.remove(id, tierId);
        res.statusMessage = 'OK.';
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
exports.deleteSupportTier = deleteSupportTier;
//# sourceMappingURL=petition.support_tier.controller.js.map