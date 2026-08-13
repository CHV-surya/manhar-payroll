import express from "express";
import {
  recalculateOutstandingFromMonth,
} from "../services/recalculateOutstanding.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      year,
      month,
    } = req.body;

    if (
      !employeeId ||
      !year ||
      !month
    ) {
      return res.status(400).json({
        success: false,
        message:
          "employeeId, year and month are required.",
      });
    }

    const updatedRecords =
      await recalculateOutstandingFromMonth(
        String(employeeId).trim(),
        Number(year),
        Number(month)
      );

    return res.json({
      success: true,
      message:
        "Outstanding chain recalculated successfully.",
      records: updatedRecords,
    });
  } catch (error) {
    console.error(
      "Recalculation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to recalculate outstanding.",
    });
  }
});

export default router;