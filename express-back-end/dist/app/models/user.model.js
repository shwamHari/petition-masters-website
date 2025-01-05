"use strict";
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
exports.checkUserAuth = exports.edit = exports.checkEmail = exports.getOne = exports.logout = exports.login = exports.insert = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const insert = (first, last, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding user ${first} ${last} to the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'insert into user (first_name, last_name, email, password) values ( ?, ?, ?, ? )';
    const [result] = yield conn.query(query, [first, last, email, password]);
    yield conn.release();
    return result;
});
exports.insert = insert;
const login = (email, password, authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`logging in user ${email}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set auth_token=? where email=? and password=?';
    const [result] = yield conn.query(query, [authToken, email, password]);
    yield conn.release();
    return result;
});
exports.login = login;
const logout = (authKey) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`logging out user`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set auth_token = null where auth_token = ?';
    const [result] = yield conn.query(query, [authKey]);
    yield conn.release();
    return result;
});
exports.logout = logout;
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting information of user ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from user where id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getOne = getOne;
const checkEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if email ${email} already exists`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from user where email = ?';
    const [rows] = yield conn.query(query, [email]);
    yield conn.release();
    return rows;
});
exports.checkEmail = checkEmail;
const edit = (id, newUser) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating information of user ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set email = ?, first_name = ?, last_name = ?, password = ? where id = ?';
    const [result] = yield conn.query(query, [newUser.email, newUser.first_name, newUser.last_name, newUser.password, id]);
    yield conn.release();
    return result;
});
exports.edit = edit;
const checkUserAuth = (authKey) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if user is authorized`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from user where auth_token = ?';
    const [rows] = yield conn.query(query, [authKey]);
    yield conn.release();
    return rows;
});
exports.checkUserAuth = checkUserAuth;
//# sourceMappingURL=user.model.js.map