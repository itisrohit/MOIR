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
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const ApiError_1 = require("../utils/ApiError");
const verifyJWT = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const refreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
            ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken) ||
            ((_c = req.header('Authorization')) === null || _c === void 0 ? void 0 : _c.replace('Bearer ', ''));
        if (!refreshToken) {
            throw new ApiError_1.ApiError(401, 'Refresh token is required');
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield user_model_1.User.findById(decoded._id);
        if (!user) {
            throw new ApiError_1.ApiError(401, 'Invalid refresh token or user doesn\'t exist');
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new ApiError_1.ApiError(401, 'Invalid or expired refresh token'));
        }
        next(error);
    }
});
exports.verifyJWT = verifyJWT;
