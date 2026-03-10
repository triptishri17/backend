const express = require("express");
const router = express.Router();

const authentication = require("../../middlewares/authentication");
const Report = require("../../models/report.model");

/* ===========================
   CREATE REPORT
=========================== */
router.post("/create", authentication, async (req, res) => {
  try {
    const report = await Report.create({
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      data: req.body.data,
      generatedBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    console.error("Create Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   GET ALL REPORTS
=========================== */
router.get("/all", authentication, async (req, res) => {
  try {
    const reports = await Report.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   DELETE REPORT
=========================== */
router.patch("/delete/:id", authentication, async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete Report Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;