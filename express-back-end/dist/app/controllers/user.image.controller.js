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
exports.deleteImage = exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const fs_1 = __importDefault(require("fs"));
const user = __importStar(require("../models/user.model"));
const userImage = __importStar(require("../models/user.images.model"));
const path_1 = __importDefault(require("path"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET getting profile picture of user ${req.params.id}`);
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }
        const resultUser = yield user.getOne(id);
        if (resultUser.length === 0) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        if (!resultUser[0].image_filename) {
            res.statusMessage = "Not Found. User has no image";
            res.status(404).send();
            return;
        }
        const imagePath = `storage/images/${resultUser[0].image_filename}`;
        if (!fs_1.default.existsSync(imagePath)) {
            res.statusMessage = "Not Found. Users image does not exist";
            res.status(404).send();
            return;
        }
        const mimeType = path_1.default.extname(resultUser[0].image_filename) === '.png' ? 'image/png' :
            path_1.default.extname(resultUser[0].image_filename) === '.jpeg' || path_1.default.extname(resultUser[0].image_filename) === '.jpg' ? 'image/jpeg' :
                path_1.default.extname(resultUser[0].image_filename) === '.gif' ? 'image/gif' : null;
        if (!mimeType) {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
        fs_1.default.readFile(imagePath, (err, data) => {
            if (err) {
                logger_1.default.error(`Error reading image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            }
            else {
                res.setHeader('Content-Type', mimeType);
                res.status(200).send(data);
            }
        });
    }
    catch (_a) {
        res.status(500).send('Internal Server Error');
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`PUT setting profile picture of user ${req.params.id}`);
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }
        const resultUser = yield user.getOne(id);
        if (resultUser.length === 0) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }
        let authKey = req.headers['x-authorization'];
        if (Array.isArray(authKey)) {
            authKey = authKey[0]; // Get the first value
        }
        if (!authKey || authKey.trim() === '') {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        if (resultUser[0].auth_token !== authKey) {
            res.statusMessage = "Forbidden. Can not change another users profile photo";
            res.status(403).send();
            return;
        }
        if (!req.body || !(req.body instanceof Buffer)) {
            res.statusMessage = "Bad Request. No image data provided";
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
            res.statusMessage = "Bad Request. Invalid image type";
            res.status(400).send();
            return;
        }
        const imageFilename = `user_${id}${fileExtension}`;
        const imagePath = `storage/images/${imageFilename}`;
        fs_1.default.writeFile(imagePath, req.body, { flag: 'w' }, (err) => {
            if (err) {
                logger_1.default.error(`Error saving image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
            }
            else {
                if (resultUser[0].image_filename !== undefined && resultUser[0].image_filename !== null) {
                    userImage.updateImage(id, imageFilename)
                        .then(() => {
                        res.statusMessage = "OK. Image updated";
                        res.status(200).send();
                    })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                        logger_1.default.error(`Error updating user's profile photo filename: ${err.message}`);
                        res.statusMessage = "Internal Server Error";
                        res.status(500).send();
                    });
                }
                else {
                    userImage.updateImage(id, imageFilename)
                        .then(() => {
                        res.statusMessage = "Created. New image created";
                        res.status(201).send();
                    })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                        logger_1.default.error(`Error updating user's profile photo filename: ${err.message}`);
                        res.statusMessage = "Internal Server Error";
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
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }
        const resultUser = yield user.getOne(id);
        if (resultUser.length === 0) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send();
            return;
        }
        let authKey = req.headers['x-authorization'];
        if (Array.isArray(authKey)) {
            authKey = authKey[0]; // Get the first value
        }
        if (!authKey || authKey.trim() === '') {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        if (resultUser[0].auth_token !== authKey) {
            res.statusMessage = "Forbidden. Can not delete another user\'s profile photo";
            res.status(403).send();
            return;
        }
        const imageFilename = resultUser[0].image_filename;
        if (!imageFilename) {
            res.statusMessage = "Not found. User does not have a profile photo";
            res.status(404).send();
            return;
        }
        const imagePath = `storage/images/${imageFilename}`;
        if (fs_1.default.existsSync(imagePath)) {
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    logger_1.default.error(`Error deleting image file: ${err.message}`);
                    res.statusMessage = "Internal Server Error";
                    res.status(500).send();
                }
                else {
                    // Remove the profile photo filename from the database
                    userImage.deleteImage(id)
                        .then(() => {
                        res.statusMessage = "OK. Image deleted";
                        res.status(200).send();
                    })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                        logger_1.default.error(`Error removing profile photo filename from database: ${err.message}`);
                        res.statusMessage = "Internal Server Error";
                        res.status(500).send();
                    });
                }
            });
            return;
        }
        else {
            userImage.deleteImage(id)
                .then(() => {
                res.statusMessage = "OK. Image deleted";
                res.status(200).send();
            });
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.image.controller.js.map