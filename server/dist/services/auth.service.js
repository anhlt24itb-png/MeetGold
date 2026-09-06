"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_model_1 = require("../models/user.model");
const env_1 = require("../config/env");
class AuthService {
    static async register(dto) {
        const email = dto.email.trim().toLowerCase();
        const username = dto.username.trim();
        const existingEmail = await user_model_1.UserModel.findByEmail(email);
        if (existingEmail) {
            throw new Error('Email is already in use');
        }
        const existingUsername = await user_model_1.UserModel.findByUsername(username);
        if (existingUsername) {
            throw new Error('Username is already taken');
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(dto.password, salt);
        const newUser = {
            id: (0, uuid_1.v4)(),
            username,
            email,
            password_hash: passwordHash,
            createdAt: new Date().toISOString(),
        };
        await user_model_1.UserModel.create(newUser);
        const user = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            createdAt: newUser.createdAt,
        };
        const token = this.generateToken(user);
        return { token, user };
    }
    static async login(dto) {
        const email = dto.email.trim().toLowerCase();
        const userRecord = await user_model_1.UserModel.findByEmail(email);
        if (!userRecord) {
            throw new Error('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(dto.password, userRecord.password_hash);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }
        const user = {
            id: userRecord.id,
            username: userRecord.username,
            email: userRecord.email,
            createdAt: userRecord.createdAt,
        };
        const token = this.generateToken(user);
        return { token, user };
    }
    static generateToken(user) {
        return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, env_1.ENV.JWT_SECRET, { expiresIn: '7d' });
    }
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
    }
}
exports.AuthService = AuthService;
