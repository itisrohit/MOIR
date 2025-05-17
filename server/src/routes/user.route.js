"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_controller_1 = require("../controllers/User.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Authentication routes
router.post('/register', User_controller_1.registerUser);
router.post('/login', User_controller_1.loginUser);
router.post('/logout', auth_middleware_1.verifyJWT, User_controller_1.logoutUser);
router.get('/profile', auth_middleware_1.verifyJWT, User_controller_1.getUserProfile);
// Other user routes can be added here
// router.put('/update', verifyJWT, updateUserProfile);
// router.get('/search', searchUsers);
exports.default = router;
