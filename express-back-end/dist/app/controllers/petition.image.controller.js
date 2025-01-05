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
exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const user = __importStar(require("../models/user.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const petition = __importStar(require("../models/petition.model"));
const petitionImage = __importStar(require("../models/petition.image.model"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found. No petition with id.`;
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = `Not Found. No petition with id.`;
            res.status(404).send();
            return;
        }
        if (!resultPetition[0].image_filename) {
            res.statusMessage = `Not Found. Petition has no image.`;
            res.status(404).send();
            return;
        }
        const petitionPath = `storage/images/${resultPetition[0].image_filename}`;
        if (!fs_1.default.existsSync(petitionPath)) {
            res.statusMessage = `Not Found. Petition has no image.`;
            res.status(404).send();
            return;
        }
        const mimeType = path_1.default.extname(resultPetition[0].image_filename) === '.png' ? 'image/png' :
            path_1.default.extname(resultPetition[0].image_filename) === '.jpeg' || path_1.default.extname(resultPetition[0].image_filename) === '.jpg' ? 'image/jpeg' :
                path_1.default.extname(resultPetition[0].image_filename) === '.gif' ? 'image/gif' : null;
        if (!mimeType) {
            // Return 500 if unable to determine MIME type
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
        fs_1.default.readFile(petitionPath, (err, data) => {
            if (err) {
                logger_1.default.error(`Error reading petition file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            }
            else {
                res.setHeader('Content-Type', mimeType);
                res.status(200).send(data);
                return;
            }
        });
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No petition found with id.";
            res.status(404).send();
            return;
        }
        const resultPetition = yield petition.getOne(id);
        if (resultPetition.length === 0) {
            res.statusMessage = "Not found. No petition found with id.";
            res.status(404).send();
            return;
        }
        let authKey = req.headers['x-authorization'];
        if (Array.isArray(authKey)) {
            authKey = authKey[0]; // Get the first value
        }
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
            res.statusMessage = 'Forbidden. Only the owner of a petition can change the hero image.';
            res.status(403).send();
            return;
        }
        if (!req.body || !(req.body instanceof Buffer)) {
            res.statusMessage = 'Bad Request. No image data provided.';
            res.status(400).send();
            return;
        }
        const contentType = req.headers['content-type'];
        let fileExtension = '';
        if (contentType === 'image/png') {
            fileExtension = '.png';
        }
        else if (contentType === 'image/jpeg') {
            fileExtension = '.jpeg';
        }
        else if (contentType === 'image/gif') {
            fileExtension = '.gif';
        }
        else {
            res.statusMessage = 'Bad Request. Invalid image type.';
            res.status(400).send();
            return;
        }
        const imageFilename = `petition_${id}${fileExtension}`;
        const imagePath = `storage/images/${imageFilename}`;
        fs_1.default.writeFile(imagePath, req.body, { flag: 'w' }, (err) => {
            if (err) {
                logger_1.default.error(`Error saving image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
            }
            else {
                if (resultPetition[0].image_filename !== undefined && resultPetition[0].image_filename !== null) {
                    petitionImage.updateImage(id, imageFilename)
                        .then(() => {
                        res.statusMessage = "OK. Image updated";
                        res.status(200).send();
                    })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                        logger_1.default.error(`Error updating user's profile photo filename: ${err.message}`);
                        res.statusMessage = "Internal Server Error.";
                        res.status(500).send();
                    });
                }
                else {
                    petitionImage.updateImage(id, imageFilename)
                        .then(() => {
                        res.statusMessage = "Created. New image created.";
                        res.status(201).send();
                    })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                        logger_1.default.error(`Error updating user's profile photo filename: ${err.message}`);
                        res.statusMessage = "Internal Server Error.";
                        res.status(500).send();
                    });
                }
            }
        });
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.setImage = setImage;
//# sourceMappingURL=petition.image.controller.js.map