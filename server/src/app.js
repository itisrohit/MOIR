"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json({ limit: "16kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "16kb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
//-------------------------------------------------
// Routes Import
const user_route_1 = __importDefault(require("./routes/user.route"));
//routes declaration
const API_PREFIX = "/api/v1";
// Routes
app.use(`${API_PREFIX}/user`, user_route_1.default);
//-------------------------------------------------
// Health check route
app.get("/health", (_, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is up and running",
    });
});
// Root route
app.get("/", (_, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to the API",
    });
});
