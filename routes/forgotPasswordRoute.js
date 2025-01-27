// const express = require("express");
// const nodemailer = require("nodemailer");
// const { executeQuery } = require("../config/db");
// require("dotenv").config();

// const router = express.Router();

// router.post("/forgotpassword", async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ success: false, message: "Email is required" });
//     }

//     try {
//         // Check if the user exists
//         const query = "SELECT * FROM users WHERE email = ?";
//         const [rows] = await executeQuery(query, [email]);

//         if (rows.length === 0) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }
 
//         console.log(process.env.SENDINBLUE_EMAIL);
//         console.log(process.env.SENDINBLUE_API_KEY);

//         // Create transporter for Sendinblue
//         const transporter = nodemailer.createTransport({
//             service: "Sendinblue",
//             auth: {
//                 user: process.env.SENDINBLUE_EMAIL,
//                 pass: process.env.SENDINBLUE_API_KEY,
//             },
//         });

//         const mailOptions = {
//             from: process.env.SENDINBLUE_EMAIL,
//             to: email,
//             subject: "Password Reset Request",
//             text: "Click on the link below to reset your password:\n\nhttp://your-frontend-url.com/reset-password?email=" + email,
//         };

//         await transporter.sendMail(mailOptions);

//         return res.status(200).json({ success: true, message: "Password reset email sent!" });
//     } catch (error) {
//         console.error("Error sending email:", error);
//         return res.status(500).json({ success: false, message: "Failed to send email" });
//     }
// });

// module.exports = router;


const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { executeQuery } = require("../config/db");
require("dotenv").config();

const router = express.Router();

// Forgot Password - Generate Token
router.post("/forgotpassword", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const query = "SELECT * FROM users WHERE email = ?";
        const [rows] = await executeQuery(query, [email]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate Reset Token
        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });

        return res.status(200).json({ success: true, message: "Token generated!", token: resetToken });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong!" });
    }
});

// Reset Password - Store New Password
router.post("/resetpassword", async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await executeQuery("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

        return res.status(200).json({ success: true, message: "Password reset successfully!" });
    } catch (error) {
        console.error("JWT Error:", error);
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
});

module.exports = router;
