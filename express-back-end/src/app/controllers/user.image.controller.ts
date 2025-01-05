import {Request, Response} from "express";
import Logger from "../../config/logger";
import axios from 'axios';
import fs from 'fs';
import * as user from "../models/user.model";
import * as userImage from "../models/user.images.model";
import path from "path";

const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET getting profile picture of user ${req.params.id}`);
    try {
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send()
            return;
        }

        const resultUser = await user.getOne(id);

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

        const imagePath = `storage/images/${resultUser[0].image_filename}`

        if (!fs.existsSync(imagePath)) {
            res.statusMessage = "Not Found. Users image does not exist";
            res.status(404).send();
            return;
        }

        const mimeType = path.extname(resultUser[0].image_filename) === '.png' ? 'image/png' :
            path.extname(resultUser[0].image_filename) === '.jpeg' || path.extname(resultUser[0].image_filename) === '.jpg' ? 'image/jpeg' :
                path.extname(resultUser[0].image_filename) === '.gif' ? 'image/gif' : null;

        if (!mimeType) {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }

        fs.readFile(imagePath, (err, data) => {
            if (err) {
                Logger.error(`Error reading image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            } else {
                res.setHeader('Content-Type', mimeType);
                res.status(200).send(data);
            }
        });

    } catch {
        res.status(500).send('Internal Server Error');
    }

}

const setImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`PUT setting profile picture of user ${req.params.id}`);
    try{
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send()
            return;
        }

        const resultUser = await user.getOne(id);

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
            res.status(403).send()
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
        } else if (contentType === 'image/jpeg') {
            fileExtension = '.jpeg';
        } else if (contentType === 'image/gif') {
            fileExtension = '.gif';
        } else {
            res.statusMessage = "Bad Request. Invalid image type";
            res.status(400).send();
            return;
        }

        const imageFilename = `user_${id}${fileExtension}`;
        const imagePath = `storage/images/${imageFilename}`;

        fs.writeFile(imagePath, req.body, { flag: 'w' }, (err) => {
            if (err) {
                Logger.error(`Error saving image file: ${err.message}`);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
            } else {
                if (resultUser[0].image_filename !== undefined && resultUser[0].image_filename !== null) {
                    userImage.updateImage(id, imageFilename)
                        .then(() => {
                            res.statusMessage = "OK. Image updated";
                            res.status(200).send();
                        })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                            Logger.error(`Error updating user's profile photo filename: ${err.message}`);
                            res.statusMessage = "Internal Server Error";
                            res.status(500).send();
                        });
                } else {
                    userImage.updateImage(id, imageFilename)
                    .then(() => {
                        res.statusMessage = "Created. New image created";
                        res.status(201).send();
                    })
                    // tslint:disable-next-line:no-shadowed-variable
                    .catch((err) => {
                        Logger.error(`Error updating user's profile photo filename: ${err.message}`);
                        res.statusMessage = "Internal Server Error";
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Not found. No such user with ID given";
            res.status(404).send()
            return;
        }

        const resultUser = await user.getOne(id);

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
            res.status(403).send()
            return;
        }

        const imageFilename = resultUser[0].image_filename;
        if (!imageFilename) {
            res.statusMessage = "Not found. User does not have a profile photo";
            res.status(404).send();
            return;
        }


        const imagePath = `storage/images/${imageFilename}`;
        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    Logger.error(`Error deleting image file: ${err.message}`);
                    res.statusMessage = "Internal Server Error";
                    res.status(500).send();
                } else {
                    // Remove the profile photo filename from the database
                    userImage.deleteImage(id)
                        .then(() => {
                            res.statusMessage = "OK. Image deleted";
                            res.status(200).send();
                        })
                        // tslint:disable-next-line:no-shadowed-variable
                        .catch((err) => {
                            Logger.error(`Error removing profile photo filename from database: ${err.message}`);
                            res.statusMessage = "Internal Server Error";
                            res.status(500).send();
                        });
                }
            });
            return;
        } else {
            userImage.deleteImage(id)
                .then(() => {
                    res.statusMessage = "OK. Image deleted";
                    res.status(200).send();
                })
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}