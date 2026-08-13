import dotenv from "dotenv";
import recalculateRouter from "./routes/recalculate.js";
dotenv.config({
  path: ".env.local",
});

import express from "express";
import cors from "cors";

import { prisma } from "./prisma.js";
import payrollRouter from "./routes/payroll.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/payroll", payrollRouter);
app.use(
  "/api/payroll/recalculate",
  recalculateRouter
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});