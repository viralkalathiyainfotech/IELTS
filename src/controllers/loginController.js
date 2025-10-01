import Register from "../models/registerModel.js";
import { ThrowError } from "../utils/ErrorUtils.js"
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"
import jwt from "jsonwebtoken";
import { sendSuccessResponse, sendErrorResponse, sendBadRequestResponse, sendUnauthorizedResponse } from '../utils/ResponseUtils.js';
import dotenv from "dotenv";
dotenv.config();
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendBadRequestResponse(res, "Email and password are required");
        }

        const user = await Register.findOne({ email: email.toLowerCase() });
        if (!user) {
            return sendErrorResponse(res, 404, "User not found");
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return sendUnauthorizedResponse(res, "Invalid password");
        }

        // Generate JWT token
        const token = await user.getJWT();
        if (!token) {
            return sendErrorResponse(res, 500, "Failed to generate token");
        }

        // Return user data with role and isAdmin status
        return sendSuccessResponse(res, "Login successful", {
            id: user._id,
            name: user.name,
            email: user.email,
            isSubcribed: user.isSubscribed,
            planStatus: user.planStatus,
            image: user.image,
            role: user.role || 'user',
            isAdmin: user.role === 'admin',
            token: token
        });
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
};

//forgot password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return sendBadRequestResponse(res, "Email is required");
        }

        const user = await Register.findOne({ email: email });
        if (!user) {
            return sendErrorResponse(res, 404, "User not found");
        }

        // Generate OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Save user and verify OTP was saved
        await user.save();
        const savedUser = await Register.findOne({ email: email });
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.MY_GMAIL || "darshan1kalathiyainfotech@gmail.com",
                    pass: process.env.MY_PASSWORD,
                },
                tls: { rejectUnauthorized: false },
            });
    
            const mailOptions = {
                from: process.env.MY_GMAIL || "darshan1kalathiyainfotech@gmail.com",
                to: email,
                subject: "Password Reset OTP",
                text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
            };
    
            await transporter.sendMail(mailOptions);
            return sendSuccessResponse(res, "OTP sent successfully to your email");
            
        } catch (error) {
            return sendErrorResponse(res, 500, error.message);
        }

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

//Verify Email
export const VerifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return sendBadRequestResponse(res, "Please provide email and OTP.");
        }

        const user = await Register.findOne({ email: email });
        if (!user) {
            return sendErrorResponse(res, 404, "User not found.");
        }

        // Check if OTP exists and is not expired
        if (!user.otp || !user.otpExpiry) {
            return sendBadRequestResponse(res, "No OTP found. Please request a new OTP.");
        }

        if (user.otp !== otp) {
            return sendBadRequestResponse(res, "Invalid OTP.");
        }

        if (user.otpExpiry < Date.now()) {
            return sendBadRequestResponse(res, "OTP has expired. Please request a new OTP.");
        }

        await user.save();

        return sendSuccessResponse(res, "OTP verified successfully.");

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Reset Password using OTP
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!newPassword || !confirmPassword) {
            return sendBadRequestResponse(res, "Please provide email, newpassword and confirmpassword.");
        }

        const user = await Register.findOne({ email: email });
        if (!user) {
            return sendErrorResponse(res, 400, "User Not Found");
        }

        if (!(newPassword === confirmPassword)) {
            return sendBadRequestResponse(res, "Please check newpassword and confirmpassword.");
        }

        await Register.findOne({ password: newPassword });
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return sendSuccessResponse(res, "Password reset successfully.", { id: user._id, email: user.email });
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Change Password for user
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return sendBadRequestResponse(res, "oldPassword, newPassword, and confirmPassword are required.");
        }

        // Get user from the authenticated request
        const user = await Register.findById(req.user._id);
        if (!user) {
            return sendErrorResponse(res, 404, "User not found");
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return sendBadRequestResponse(res, "Current password is incorrect.");
        }

        if (newPassword === oldPassword) {
            return sendBadRequestResponse(res, "New password cannot be the same as current password.");
        }

        if (newPassword !== confirmPassword) {
            return sendBadRequestResponse(res, "New password and confirm password do not match.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return sendSuccessResponse(res, "Password changed successfully.");

    } catch (error) {
        return sendErrorResponse(res, 500, error.message);
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { uid, name, email, avatar } = req.body;

        if (!uid || !name || !email || !avatar) {
            return res.status(400).json({
                success: false,
                message: "uid, name, email & avatar are required!"
            });
        }

        let user = await Register.findOne({ email });

        if (user) {
            // Update user info if it changed
            const updatedFields = {};
            if (user.name !== name) updatedFields.name = name;
            if (user.avatar !== avatar) updatedFields.avatar = avatar;
            if (user.uid !== uid) updatedFields.uid = uid;

            if (Object.keys(updatedFields).length > 0) {
                user = await Register.findByIdAndUpdate(user._id, updatedFields, { new: true });
            }
        } else {
            // Create new user
            user = await Register.create({
                uid,
                name,
                email,
                avatar,
                verified: true
            });
        }

        // Generate JWT token
        const payload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.status(user.isNew ? 201 : 200).json({
            success: true,
            message: user.isNew
                ? "New social login & registration successful"
                : "Login successful",
            user,
            token
        });

    } catch (error) {
        console.error("Social Register Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error while registering social user",
            error: error.message
        });
    }
};