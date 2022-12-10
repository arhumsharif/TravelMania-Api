const fs = require("fs");
const md5 = require("md5");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/config")
const checkAuth = require("../middleware/check-auth");
// test Result
router.get("/", (req, res) => {
  res.send("Put is working...");
});

router.put("/change-password", checkAuth, (req, res) => {
  let currentPassword = req.body.currentPassword;
  let newPassword = req.body.newPassword;
  let newPassword1 = req.body.newPassword1;
  if (newPassword != newPassword1) {
    return res.status(412).json({ message: "Passwords must be same!" });
  }
  if (newPassword == currentPassword) {
    return res.status(412).json({ message: "Invalid New Password!" });
  }
  newPassword = db.connection.escape(md5(newPassword));
  let userGuid = db.connection.escape(req.userData.UserGuid);
  let sql = `UPDATE  tbl_users SET UserPassword = ${newPassword} WHERE UserGuid=${userGuid}`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 415PEC" });
      }

      return res.status(201).json({
        message: "Password Updated Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

//edit classroom

router.put("/edit-classroom", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classroomGuid);
  let classroomDesc = db.connection.escape(req.body.classroomDesc);
  let classroomCapacity = db.connection.escape(req.body.classroomCapacity);
  let sql = `UPDATE  tbl_classrooms SET  ClassroomDesc = ${classroomDesc}, ClassroomCapacity = ${classroomCapacity} WHERE ClassroomGuid=${classroomGuid}`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 415PEC" });
      }

      return res.status(201).json({
        message: "Classroom Updated Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

//mark attendance
router.put("/markAttendance", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classroomGuid);
  let lectureGuid = db.connection.escape(req.body.lectureGuid);
  let attendance = db.connection.escape(req.body.attendance);
  let attendanceGuid = db.connection.escape(req.body.attendanceGuid);
  let studentGuid = db.connection.escape(req.body.student);
  let sql = `UPDATE tbl_student_attendance SET StuAttendanceStatus = ${attendance} WHERE ParticipantGuid = ${studentGuid} AND AttendanceGuid = ${attendanceGuid}`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 415PEC" });
      }

      return res.status(200).json({
        message: "Updated Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

//edit student
router.put("/edit-user", checkAuth, (req, res) => {
  if (req.userData.Role != "admin") {
    // Precondition Failed
    return res.status(412).json({ message: "Error: 412" });
  }
  let userGuid = db.connection.escape(req.body.userGuid);
  let sql1 = `SELECT * FROM tbl_users WHERE UserGuid = ${userGuid}`;
  try {
    let query = db.Query(sql1).then(({err:err1, result}) => {
      if (err1) {
        return res.status(412).json({ message: "Error: 415-PEU" });
      }
      if (result.length <= 0) {
        return res.status(412).json({ message: "Error: 415-PEU-EMP" });
      }
      let FullName = db.connection.escape(req.body.firstName + " " + req.body.lastName);
      if (FullName == "") {
        FullName = result[0].UserFullName;
      }
      //   let email = db.connection.escape(req.body.email); // Under consideration
      let cnic = db.connection.escape(req.body.cnic);
      if (cnic == "") {
        cnic = result[0].UserCnic;
      }
      let address = db.connection.escape(req.body.address);
      if (address == "") {
        address = result[0].UserAddress;
      }
      let phone = db.connection.escape(req.body.phone);
      if (phone == "") {
        phone = result[0].UserPhone;
      }
      let userImageUrl = db.connection.escape("");
      let sql = `UPDATE tbl_users SET  UserFullName = ${FullName}, UserAddress = ${address}, UserImageUrl = ${userImageUrl}, UserPhone = ${phone}, UserCnic = ${cnic} WHERE UserGuid=${userGuid}`;
      try {
        let query = db.Query(sql).then(({err:err1, result:results2}) => {
          if (err1) {
            return res.status(415).json({ message: "Error: 415-PES1" });
          }

          return res.status(200).json({
            message: "User Updated Successfully!",
          });
        });
      } catch (error) {
        return res.status(501).json({
          message: "Not Implemented2!",
        });
      }
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

module.exports = router;
