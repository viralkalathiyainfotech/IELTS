import express from "express";
import { upload, convertJfifToJpeg } from "../middlewares/imageupload.js";
import { isAdmin, isUser, UserAuth } from "../middlewares/auth.js";
import { createRegister, getRegisterById, getAllUsers, updateProfileUser, updateProfileAdmin } from "../controllers/registerController.js";
import { changePassword, forgotPassword, loginUser, resetPassword, VerifyEmail } from '../controllers/loginController.js';
import { addAbout, deleteAbout, getAboutById, getAllAbout, updateAbout } from "../controllers/aboutController.js";
import { addPrivacyPolicy, deletePrivacyPolicy, getAllPrivacyPolicy, getPrivacyPolicyById, updatePrivacyPolicy } from "../controllers/privacyPolicyController.js";
import { createPremium, deletePremium, getAllPremium, getPremiumById, updatePremium } from "../controllers/premiumController.js";
import { createPayment, deletePayment, getAllPayments, getMySubscription, getPaymentById, updatePayment } from "../controllers/paymentController.js";
import { addReadingTest, getAllReadingTests, getReadingTest } from "../controllers/readingController.js";

const indexRoutes = express.Router()

//Regitser Routes
indexRoutes.post("/createRegister", createRegister)
indexRoutes.get("/getRegisterById/:id", UserAuth, getRegisterById)
indexRoutes.get("/getAllUsers", UserAuth, getAllUsers)
indexRoutes.put("/updateProfileUser/:id", UserAuth, isUser, upload.single("image"), convertJfifToJpeg, updateProfileUser)
indexRoutes.put("/updateProfileAdmin/:id", UserAuth, isAdmin, upload.single("image"), convertJfifToJpeg, updateProfileAdmin)

//login Routes
indexRoutes.post('/loginUser', loginUser);
indexRoutes.post('/forgotPassword', forgotPassword);
indexRoutes.post('/VerifyEmail', VerifyEmail);
indexRoutes.post('/resetPassword', resetPassword);
indexRoutes.post('/changePassword', UserAuth, changePassword);
// indexRoutes.post('/logoutUser', UserAuth, logoutUser);

//About Routes
indexRoutes.post('/addAbout', UserAuth, isAdmin, addAbout)
indexRoutes.get('/getAllAbout', UserAuth, getAllAbout)
indexRoutes.get('/getAboutById/:id', UserAuth, getAboutById)
indexRoutes.put('/updateAbout/:id', UserAuth, isAdmin, updateAbout)
indexRoutes.delete('/deleteAbout/:id', UserAuth, isAdmin, deleteAbout)

//PrivacyPolicy Routes
indexRoutes.post('/addPrivacyPolicy', UserAuth, isAdmin, addPrivacyPolicy)
indexRoutes.get('/getAllPrivacyPolicy', UserAuth, getAllPrivacyPolicy)
indexRoutes.get('/getPrivacyPolicyById/:id', UserAuth, getPrivacyPolicyById)
indexRoutes.put('/updatePrivacyPolicy/:id', UserAuth, isAdmin, updatePrivacyPolicy)
indexRoutes.delete('/deletePrivacyPolicy/:id', UserAuth, isAdmin, deletePrivacyPolicy)

//Premium Routes
indexRoutes.post("/createPremium", UserAuth, isAdmin, createPremium)
indexRoutes.get("/getAllPremium", UserAuth, getAllPremium)
indexRoutes.get("/getPremiumById/:id", UserAuth, isAdmin, getPremiumById)
indexRoutes.put("/updatePremium/:id", UserAuth, isAdmin, updatePremium)
indexRoutes.delete("/deletePremium/:id", UserAuth, isAdmin, deletePremium)

//payment Routes
indexRoutes.post("/createPayment", UserAuth, isUser, createPayment)
indexRoutes.get("/getAllPayments", UserAuth, isAdmin, getAllPayments)
indexRoutes.get("/getPaymentById/:id", UserAuth, getPaymentById)
indexRoutes.put("/updatePayment/:id", UserAuth, isUser, updatePayment)
indexRoutes.delete("/deletePayment/:id", UserAuth, isUser, deletePayment)
indexRoutes.get('/getMySubscription', UserAuth, isUser, getMySubscription);

// Reading Module Routes
// Admin: Add a new reading test
indexRoutes.post("/admin/reading-tests", UserAuth, isAdmin, addReadingTest);
// User: Get all reading tests
indexRoutes.get("/reading-tests", UserAuth, getAllReadingTests);
// User: Get a single reading test
indexRoutes.get("/reading-tests/:id", UserAuth, getReadingTest);

export default indexRoutes