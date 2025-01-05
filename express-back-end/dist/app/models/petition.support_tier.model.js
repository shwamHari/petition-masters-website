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
exports.remove = exports.patchSupportTier = exports.getSupportTierSupporters = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getSupportTierSupporters = (id, tierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`checking if petition ${id} tier ${tierId} has any supporters`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'select * from supporter where petition_id = ? and support_tier_id = ?';
    const [rows] = yield conn.query(query, [id, tierId]);
    yield conn.release();
    return rows;
});
exports.getSupportTierSupporters = getSupportTierSupporters;
const patchSupportTier = (params, id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`editing support tier ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let query = 'update support_tier set';
    if (params.title) {
        query += ' support_tier.title = "' + params.title + '",';
    }
    if (params.description) {
        query += ' support_tier.description = "' + params.description + '",';
    }
    if (params.cost) {
        query += ' support_tier.cost = ' + params.cost + ',';
    }
    query = query.slice(0, -1);
    query += ` where id = ${id}`;
    const [rows] = yield conn.query(query);
    yield conn.release();
    return rows;
});
exports.patchSupportTier = patchSupportTier;
const remove = (id, tierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`deleting support tier ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'delete from support_tier where id = ? and petition_id = ?';
    const [result] = yield conn.query(query, [tierId, id]);
    yield conn.release();
    return result;
});
exports.remove = remove;
//# sourceMappingURL=petition.support_tier.model.js.map