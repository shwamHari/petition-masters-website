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
exports.deleteImage = exports.updateImage = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const updateImage = (id, newImageName) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating profile picture of user ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set image_filename = ? where id = ?';
    const [result] = yield conn.query(query, [newImageName, id]);
    yield conn.release();
    return result;
});
exports.updateImage = updateImage;
const deleteImage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`deleting profile picture of user ${id}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'update user set image_filename = null where id = ?';
    const [result] = yield conn.query(query, [id]);
    yield conn.release();
    return result;
});
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.images.model.js.map