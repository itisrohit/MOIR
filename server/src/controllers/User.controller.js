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
exports.getUserProfile = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const user_model_1 = require("../models/user.model");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const generateAccessAndRefreshTokens = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    return { accessToken, refreshToken };
});
//  Register a new user
exports.registerUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password || !name) {
        throw new ApiError_1.ApiError(400, "All fields are required");
    }
    const existingUser = yield user_model_1.User.findOne({
        $or: [{ email }, { username }],
    });
    if (existingUser) {
        throw new ApiError_1.ApiError(409, "User with email or username already exists");
    }
    const user = yield user_model_1.User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        name,
        status: "online",
    });
    const createdUser = yield user_model_1.User.findById(user._id).select("-password");
    if (!createdUser) {
        throw new ApiError_1.ApiError(500, "Something went wrong while registering the user");
    }
    const { accessToken, refreshToken } = yield generateAccessAndRefreshTokens(createdUser._id);
    res
        .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
        .cookie("accessToken", accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
    })
        .status(201)
        .json(new ApiResponse_1.ApiResponse(201, {
        sucess: true,
        user: {},
        accessToken,
    }, "User registered successfully"));
}));
//  Login a user
exports.loginUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ApiError_1.ApiError(400, "Username or email is required");
    }
    if (!password) {
        throw new ApiError_1.ApiError(400, "Password is required");
    }
    const user = yield user_model_1.User.findOne({
        $or: [{ username }, { email }],
    });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User does not exist");
    }
    const isPasswordValid = yield user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError_1.ApiError(401, "Invalid credentials");
    }
    const { accessToken, refreshToken } = yield generateAccessAndRefreshTokens(user._id);
    user.status = user_model_1.UserStatus.ONLINE;
    yield user.save({ validateBeforeSave: false });
    res
        .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
        .cookie("accessToken", accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
    })
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {
        sucess: true,
        user: {},
        accessToken,
    }, "User logged in successfully"));
}));
//  Logout a user
exports.logoutUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "Unauthorized access");
    }
    yield user_model_1.User.findByIdAndUpdate(userId, {
        status: user_model_1.UserStatus.OFFLINE
    }, { new: true });
    res
        .clearCookie("accessToken", {
        httpOnly: false,
        secure: false,
        sameSite: "none"
    })
        .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    })
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "User logged out successfully"));
}));
// Get user profile
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "Unauthorized access");
    }
    const user = yield user_model_1.User.findById(userId).select("-password");
    if (!user) {
        throw new ApiError_1.ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {
        sucess: true,
        user,
    }, "User profile fetched successfully"));
}));
