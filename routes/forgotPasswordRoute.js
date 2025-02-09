// //normal password reset


// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { executeQuery } = require("../config/db");
// require("dotenv").config();

// const router = express.Router();

// // Forgot Password - Generate Token
// router.post("/forgotpassword", async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ success: false, message: "Email is required" });
//     }

//     try {
//         const query = "SELECT * FROM users WHERE email = ?";
//         const [rows] = await executeQuery(query, [email]);

//         if (rows.length === 0) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         // Generate Reset Token
//         const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });

//         return res.status(200).json({ success: true, message: "Token generated!", token: resetToken });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({ success: false, message: "Something went wrong!" });
//     }
// });

// // Reset Password - Store New Password
// router.post("/resetpassword", async (req, res) => {
//     const { token, newPassword, confirmPassword } = req.body;

//     if (!token || !newPassword || !confirmPassword) {
//         return res.status(400).json({ success: false, message: "All fields are required" });
//     }

//     if (newPassword !== confirmPassword) {
//         return res.status(400).json({ success: false, message: "Passwords do not match" });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const email = decoded.email;

//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         await executeQuery("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

//         return res.status(200).json({ success: true, message: "Password reset successfully!" });
//     } catch (error) {
//         console.error("JWT Error:", error);
//         return res.status(400).json({ success: false, message: "Invalid or expired token" });
//     }
// });

// module.exports = router;












//new password reset
const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const { executeQuery } = require("../config/db");
require("dotenv").config();

const router = express.Router();

// Forgot Password - Generate Reset Link
router.post("/forgotpassword", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        // Check if user exists
        const query = "SELECT id FROM users WHERE email = ?";
        const [rows] = await executeQuery(query, [email]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userId = rows[0].id;
        const resetId = uuidv4(); // Generate unique UUID

        // Store request in ForgotPasswordRequests table
        await executeQuery("INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)", 
                           [resetId, userId, true]);

        // Send email with reset link
        const transporter = nodemailer.createTransport({
            service: "gmail",
            secure : true,
            port : 465,
            auth: { 
                user: "jatingyass9@gmail.com",
                pass: "wade ajtn bzab sqwx" 
            }
        });

        const resetLink = `http://localhost:3000/password/resetpassword/${resetId}`;
        await transporter.sendMail({
            from:"jatingyass9@gmail.com",
            to: email,
            subject: "Reset Your Password",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        res.json({ success: true, message: "Reset link sent to email" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
});

// Reset Password Form - Validate Reset Request
router.get("/resetpassword/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const query = "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = true";
        const [rows] = await executeQuery(query, [id]);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
        }

        // If valid, send a password reset form
        res.send(`<form action="/password/updatepassword" method="POST">
                    <input type="hidden" name="id" value="${id}" />
                    <input type="password" name="newPassword" placeholder="Enter new password" required />
                    <button type="submit">Reset Password</button>
                  </form>`);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
});

// Reset Password - Store New Password
router.post("/updatepassword", async (req, res) => {
    const { id, newPassword } = req.body;

    if (!id || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Verify request is valid
        const query = "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = true";
        const [rows] = await executeQuery(query, [id]);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        const userId = rows[0].userId;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in users table
        await executeQuery("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

        // Mark request as inactive
        await executeQuery("UPDATE ForgotPasswordRequests SET isActive = false WHERE id = ?", [id]);

        res.json({ success: true, message: "Password reset successfully!" });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
});

module.exports = router;
