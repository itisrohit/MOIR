import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

//-------------------------------------------------
// Routes Import
import userRoutes from "./routes/user.route";

//routes declaration
const API_PREFIX = "/api/v1";

// Routes
app.use(`${API_PREFIX}/user`, userRoutes);
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

export { app };
