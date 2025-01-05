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
exports.remove = exports.postSupportTier = exports.patchPetition = exports.postPetition = exports.checkIfSupporters = exports.checkCategory = exports.checkTitle = exports.getAllCategories = exports.getAllPetitions = exports.getSupportTiers = exports.getMoneyRaised = exports.getSupporterCount = exports.getOne = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting information of petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from petition where id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getOne = getOne;
const getSupporterCount = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting support count of petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select count(*) from supporter where petition_id = ?';
    const [count] = yield conn.query(query, [id]);
    yield conn.release();
    return count;
});
exports.getSupporterCount = getSupporterCount;
const getMoneyRaised = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting money raised of petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select sum(cost) from supporter join support_tier on support_tier.id = supporter.support_tier_id where supporter.petition_id = ?';
    const [amount] = yield conn.query(query, [id]);
    yield conn.release();
    return amount;
});
exports.getMoneyRaised = getMoneyRaised;
const getSupportTiers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting support tiers of petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from support_tier where petition_id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getSupportTiers = getSupportTiers;
const getAllPetitions = (params, order) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting info on all requested petitions`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let query = 'SELECT petition.id, petition.title, category_id, owner_id, user.first_name, user.last_name, COUNT(supporter.id), creation_date, cost ' +
        'from petition join support_tier on support_tier.petition_id = petition.id JOIN user on petition.owner_id = user.id left join supporter on supporter.petition_id = petition.id ' +
        'WHERE(cost <= ALL(SELECT cost FROM support_tier WHERE petition_id = petition.id))';
    if (params.q) {
        query += " and (petition.title LIKE '%" + params.q + "%' OR petition.description LIKE '%" + params.q + "%')";
    }
    if (params.categoryIds && params.categoryIds.length > 0) {
        query += " and (category_id in (";
        for (const id of params.categoryIds) {
            query += `${id}, `;
        }
        query = query.slice(0, -2);
        query += "))";
    }
    if (params.supportingCost) {
        query += ` and (cost <= ${params.supportingCost})`;
    }
    if (params.ownerId) {
        query += ` and (owner_id = ${params.ownerId})`;
    }
    if (params.supporterId) {
        query += ` AND (exists (select * from supporter where petition_id = petition.id and user_id = ${params.supporterId}))`;
    }
    query += ' GROUP BY petition.id ';
    if (order) {
        query += order + ', petition.id';
    }
    else {
        query += 'order by creation_date, petition.id';
    }
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
exports.getAllPetitions = getAllPetitions;
const getAllCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting categories information`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select id, name from category order by name';
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
exports.getAllCategories = getAllCategories;
const checkTitle = (title) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if petition title ${title} exists`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from petition where title = ?';
    const [rows] = yield conn.query(query, [title]);
    yield conn.release();
    return rows;
});
exports.checkTitle = checkTitle;
const checkCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if category id ${id} exists`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from category where id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.checkCategory = checkCategory;
const checkIfSupporters = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if petition ${id} has any supporters`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from supporter where petition_id = ?';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.checkIfSupporters = checkIfSupporters;
const postPetition = (params, userId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Creating new petition`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = "insert into petition (title, description, creation_date, owner_id, category_id) values ( ?, ?, current_date(), ?, ? )";
    const [rows] = yield conn.query(query, [params.title, params.description, userId, params.categoryId]);
    yield conn.release();
    return rows;
});
exports.postPetition = postPetition;
const patchPetition = (params, id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`editing petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let query = 'update petition set';
    if (params.title) {
        query += ' petition.title = "' + params.title + '",';
    }
    if (params.description) {
        query += ' petition.description = "' + params.description + '",';
    }
    if (params.categoryId) {
        query += ' petition.category_id = "' + params.categoryId + '",';
    }
    query = query.slice(0, -1);
    query += ` where id = ${id}`;
    logger_1.default.info(query);
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
exports.patchPetition = patchPetition;
const postSupportTier = (tier, petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`posting new support tier`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'insert into support_tier (petition_id, title, description, cost) values ( ?, ?, ?, ? )';
    const [rows] = yield conn.query(query, [petitionId, tier.title, tier.description, tier.cost]);
    yield conn.release();
    return rows;
});
exports.postSupportTier = postSupportTier;
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`deleting petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'delete from petition where id = ?';
    const [result] = yield conn.query(query, [id]);
    yield conn.release();
    return result;
});
exports.remove = remove;
//# sourceMappingURL=petition.model.js.map