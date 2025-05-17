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
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const db_1 = require("./config/db");
const app_1 = require("./app");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.connectDB)();
            const server = http_1.default.createServer(app_1.app);
            const PORT = process.env.PORT || 5000;
            server.listen(PORT, () => {
                console.log(`✅ Server running on port http://localhost:${PORT}`);
            });
            process.on('SIGTERM', () => {
                console.log('🛑 SIGTERM received, shutting down gracefully');
                server.close(() => {
                    console.log('💤 HTTP server closed');
                    process.exit(0);
                });
            });
        }
        catch (error) {
            console.error('🔥 Server initialization failed:', error);
            process.exit(1);
        }
    });
}
bootstrap();
