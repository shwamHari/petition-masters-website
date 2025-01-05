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
exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const schemas = __importStar(require("../resources/schemas.json"));
const ajv_1 = __importDefault(require("ajv"));
const EmailValidator = __importStar(require("email-validator"));
const passwords_1 = require("../services/passwords");
const user = __importStar(require("../models/user.model"));
const rand_token_1 = __importDefault(require("rand-token"));
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
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`POST create a user with name: ${req.body.firstName} ${req.body.lastName}`);
    const validation = yield validate(schemas.user_register, req.body);
    if (validation !== true || !EmailValidator.validate(req.body.email)) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }
    const first = req.body.firstName;
    const last = req.body.lastName;
    const email = req.body.email;
    const password = yield (0, passwords_1.hash)(req.body.password);
    try {
        const result = yield user.insert(first, last, email, password);
        res.status(201).send({ "userId": result.insertId });
    }
    catch (err) {
        logger_1.default.error(err.message);
        if (err.message.startsWith("Duplicate entry")) {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        }
        else {
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        const email = req.body.email;
        const password = yield (0, passwords_1.hash)(req.body.password);
        const authToken = rand_token_1.default.generate(16);
        const result = yield user.login(email, password, authToken);
        if (result.changedRows < 1) {
            res.statusMessage = `UnAuthorized. Incorrect email/password.`;
            res.status(401).send();
            return;
        }
        else {
            const resultUser = yield user.checkUserAuth(authToken);
            res.status(200).send({ "userId": resultUser[0].id, "token": authToken });
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authKey = req.headers['x-authorization'];
        const result = yield user.logout(Array.isArray(authKey) ? authKey[0] : authKey);
        if (result.changedRows < 1) {
            res.statusMessage = "UnAuthorized. Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        else {
            res.statusMessage = "User logged out successfully";
            res.status(200).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.logout = logout;
const view = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`GET single user id: ${req.params.id}`);
    let id;
    id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.statusMessage = "Bad request. Invalid information";
        res.status(400).send();
        return;
    }
    const authKey = req.headers['x-authorization'];
    try {
        const resultUser = yield user.getOne(id);
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
    }
    catch (err) {
        if (err.message.startsWith('Unknown column')) {
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send();
        }
        else {
            logger_1.default.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    }
});
exports.view = view;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.http(`PATCH update user ${req.params.id}`);
        const validation = yield validate(schemas.user_edit, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send();
            return;
        }
        let id;
        id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send();
            return;
        }
        const resultUser = yield user.getOne(id);
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
            res.status(403).send();
            return;
        }
        const updatedUser = {};
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
            const hashedCurrentPassword = yield (0, passwords_1.hash)(req.body.currentPassword);
            if (hashedCurrentPassword !== resultUser[0].password) {
                res.statusMessage = "Unauthorized or Invalid currentPassword";
                res.status(401).send();
                return;
            }
            updatedUser.password = yield (0, passwords_1.hash)(req.body.password);
        }
        else {
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
            const emailExists = yield user.checkEmail(req.body.email);
            if (emailExists.length > 0) {
                res.statusMessage = "Forbidden. Email is already in use";
                res.status(403).send();
                return;
            }
            updatedUser.email = req.body.email;
        }
        else {
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
        }
        else {
            if (req.body.lastName !== undefined && req.body.lastName === "") {
                res.statusMessage = "Bad request. Invalid information";
                res.status(400).send();
                return;
            }
            updatedUser.last_name = resultUser[0].last_name;
        }
        yield user.edit(id, updatedUser);
        res.status(200).send('OK');
        return;
    }
    catch (err) {
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.update = update;
//# sourceMappingURL=user.controller.js.map