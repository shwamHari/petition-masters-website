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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.hash = void 0;
const node_crypto_1 = require("node:crypto");
const hash = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const hasher = (0, node_crypto_1.createHash)('sha256');
    hasher.update(password);
    const hashedPassword = hasher.digest('hex');
    return hashedPassword;
});
exports.hash = hash;
const compare = (password, comp) => __awaiter(void 0, void 0, void 0, function* () {
    const passwordHash = yield hash(password);
    return (passwordHash === comp);
});
exports.compare = compare;
//# sourceMappingURL=passwords.js.map