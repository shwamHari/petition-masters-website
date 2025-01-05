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
exports.insert = exports.getAll = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getAll = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting information of supporters of petition ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT supporter.id, support_tier_id, message, supporter.user_id, first_name, last_name, timestamp ' +
        'FROM supporter JOIN user on user.id = supporter.user_id where petition_id = ? order by timestamp desc';
    const [rows] = yield conn.query(query, [id]);
    yield conn.release();
    return rows;
});
exports.getAll = getAll;
const insert = (petitionId, tierId, userId, message) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding new supporter for petition ${petitionId} at tier ${tierId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = "insert into supporter (petition_id, support_tier_id, user_id, message) values ( ?, ?, ?, ? )";
    const [rows] = yield conn.query(query, [petitionId, tierId, userId, message]);
    yield conn.release();
    return rows;
});
exports.insert = insert;
//# sourceMappingURL=petition.supporter.model.js.map