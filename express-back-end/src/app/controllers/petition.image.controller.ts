import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as user from "../models/user.model";
import fs from "fs";
import path from "path";
import * as petition from "../models/petition.model";
import * as petitionImage from "../models/petition.image.model";


const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = `Not Found. No petition with id.`;
            res.status(404).send();
            return;
        }

        const resultPetition = await petition.getOne(id);

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

        const petitionPath = `storage/images/${resultPetition[0].image_filename}`

        if (!fs.existsSync(petitionPath)) {
            res.statusMessage = `Not Found. Petition has no image.`;
            res.status(404).send();
            return;
        }

        const mimeType = path.extname(resultPetition[0].image_filename) === '.png' ? 'image/png' :
            path.extname(resultPetition[0].image_filename) === '.jpeg' || path.extname(resultPetition[0].image_filename) === '.jpg' ? 'image/jpeg' :
                path.extname(resultPetition[0].image_filename) === '.gif' ? 'image/gif' : null;

        if (!mimeType) {
            // Return 500 if unable to determine MIME type
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }

        fs.readFile(petitionPath, (err, data) => {
            if (err) {
                Logger.error(`Error reading petition file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            } else {
                res.setHeader('Content-Type', mimeType);
                res.status(200).send(data);
                return;
            }
        });

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No petition found with id.";
            res.status(404).send();
            return;
        }

        const resultPetition = await petition.getOne(id);

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

        const resultUser = await user.checkUserAuth(authKey as string);
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
        } else if (contentType === 'image/jpeg') {
            fileExtension = '.jpeg';
        } else if (contentType === 'image/gif') {
            fileExtension = '.gif';
        } else {
            res.statusMessage = 'Bad Request. Invalid image type.';
            res.status(400).send();
            return;
        }

        const imageFilename = `petition_${id}${fileExtension}`;
        const imagePath = `storage/images/${imageFilename}`;

        fs.writeFile(imagePath, req.body, { flag: 'w' }, (err) => {
            if (err) {
                Logger.error(`Error saving image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
            } else {
                if (resultPetition[0].image_filename !== undefined && resultPetition[0].image_filename !== null) {
                    petitionImage.updateImage(id, imageFilename)
                        .then(() => {
                            res.statusMessage = "OK. Image updated";
                            res.status(200).send();
                        })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                            Logger.error(`Error updating user's profile photo filename: ${err.message}`);
                            res.statusMessage = "Internal Server Error.";
                            res.status(500).send();
                        });
                } else {
                    petitionImage.updateImage(id, imageFilename)
                        .then(() => {
                            res.statusMessage = "Created. New image created.";
                            res.status(201).send();
                        })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                            Logger.error(`Error updating user's profile photo filename: ${err.message}`);
                            res.statusMessage = "Internal Server Error.";
                            res.status(500).send();
                        });
                }
            }
        });

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};