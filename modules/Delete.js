const fs = require("fs");
const md5 = require("md5");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/config")
const checkAuth = require("../middleware/check-auth");
//Delete Classroom
router.delete("/delete-classroom", checkAuth, (req, res) => {
  if (req.userData.Role != "admin") {
    // Precondition Failed
    return res.status(412).json({ message: "Error: 412" });
  }
  let classroomGuid = db.escape(req.body.classroomGuid);

  let sql = `UPDATE  tbl_classrooms SET IsDeleted='1' WHERE ClassroomGuid=${classroomGuid}`;

  try {
    let query = db.query(sql, (err1, results) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 413" });
      }

      return res.status(201).json({
        message: "Classroom Deleted Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented!",
    });
  }
});

// delete announement
router.delete("/delete-announement", checkAuth, (req, res) => {
  if (req.userData.Role != "teacher") {
    // Precondition Failed
    return res.status(412).json({ message: "Error: 412" });
  }
  let materialGuid = db.escape(req.body.announcementGuid);

  let sql = `UPDATE tbl_materials SET IsDeleted='1' WHERE MaterialGuid=${materialGuid}`;

  try {
    let query = db.query(sql, (err1, results) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 413" });
      }

      return res.status(200).json({
        message: "Material Deleted Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented!",
    });
  }
});

//Delete Teacher
router.delete("/delete-teacher", checkAuth, (req, res) => {
  if (req.userData.Role != "admin") {
    // Precondition Failed
    return res.status(412).json({ message: "Error: 412" });
  }
  let teacherGuid = db.escape(req.body.userGuid);

  let sql = `UPDATE  tbl_users SET IsDeleted='1' WHERE UserGuid=${teacherGuid}`;

  try {
    let query = db.query(sql, (err1, results) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 414" });
      }

      // Error code 200 is for Ok
      return res.status(200).json({
        message: "Teacher Deleted Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented!",
    });
  }
});

//Delete Student
router.delete("/delete-student", checkAuth, (req, res) => {
  if (req.userData.Role != "admin") {
    return res.status(412).json({ message: "Error: 412" });
  }
  let userGuid = db.escape(req.body.userGuid);

  let sql = `UPDATE tbl_users SET IsDeleted='1' WHERE UserGuid=${userGuid}`;

  try {
    let query = db.query(sql, (err1, results) => {
      if (err1) {
        // Precondition Failed
        return res.status(412).json({
          message: "Error: 415",
        });
      }

      // Error code 200 is for Ok
      return res.status(200).json({
        message: "Student Deleted Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented!",
    });
  }
});

module.exports = router;
