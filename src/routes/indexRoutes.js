import express from "express";
import { upload, convertJfifToJpeg } from "../middlewares/imageupload.js";
import { isAdmin, isUser, UserAuth } from "../middlewares/auth.js";
import { createRegister, getRegisterById, getAllUsers, updateProfileUser, updateProfileAdmin } from "../controllers/registerController.js";
import { changePassword, forgotPassword, loginUser, resetPassword, VerifyEmail } from '../controllers/loginController.js';
import { addAbout, deleteAbout, getAboutById, getAllAbout, updateAbout } from "../controllers/aboutController.js";
import { addPrivacyPolicy, deletePrivacyPolicy, getAllPrivacyPolicy, getPrivacyPolicyById, updatePrivacyPolicy } from "../controllers/privacyPolicyController.js";
import { createPremium, deletePremium, getAllPremium, getPremiumById, updatePremium } from "../controllers/premiumController.js";
import { createPayment, deletePayment, getAllPayments, getMySubscription, getPaymentById, updatePayment } from "../controllers/paymentController.js";
import { addTestDetails, deleteTestDetails, getAllTestDetails, getTestDetailsById, updateTestDetails } from "../controllers/testDetailsController.js";
import { addReadingTest, deleteReadingTest, getAllReadingTest, getReadingTestById, updateReadingTest } from "../controllers/readingTestController.js";
import { addReadingSection, deleteReadingSection, getAllReadingSection, getReadingSectionById, getSectionsByReadingTest, updateReadingSection } from "../controllers/readingSectionController.js";
import { addParagraph, deleteParagraph, getAllParagraphs, getParagraphById, getParagraphsBySection, updateParagraph } from "../controllers/paragraphController.js";
import { addQuestion, checkBulkUserAnswers, deleteQuestion, getAllQuestions, getQuestionById, getSectionCorrectAnswers, updateQuestion } from "../controllers/questionController.js";
import { checkUserAnswer, submitSectionAnswers } from "../controllers/userAnswerController.js";

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

//testDetails Routes
indexRoutes.post("/addTestDetails", UserAuth, isAdmin, addTestDetails)
indexRoutes.get("/getAllTestDetails", UserAuth, getAllTestDetails)
indexRoutes.get("/getTestDetailsById/:id", UserAuth, getTestDetailsById)
indexRoutes.put("/updateTestDetails/:id", UserAuth, isAdmin, updateTestDetails)
indexRoutes.delete("/deleteTestDetails/:id", UserAuth, isAdmin, deleteTestDetails)

//ReadingTest Routes
indexRoutes.post("/addReadingTest", UserAuth, isAdmin, addReadingTest)
indexRoutes.get("/getAllReadingTest", UserAuth, getAllReadingTest)
indexRoutes.get("/getReadingTestById/:id", UserAuth, getReadingTestById)
indexRoutes.put("/updateReadingTest/:id", UserAuth, isAdmin, updateReadingTest)
indexRoutes.delete("/deleteReadingTest/:id", UserAuth, isAdmin, deleteReadingTest)

//ReadingSection Routes
indexRoutes.post("/addReadingSection", UserAuth, isAdmin, addReadingSection)
indexRoutes.get("/getAllReadingSection", UserAuth, getAllReadingSection)
indexRoutes.get("/getReadingSectionById/:id", UserAuth, getReadingSectionById)
indexRoutes.put("/updateReadingSection/:id", UserAuth, isAdmin, updateReadingSection)
indexRoutes.delete("/deleteReadingSection/:id", UserAuth, isAdmin, deleteReadingSection)
indexRoutes.get("/getSectionsByReadingTest/:readingTestId", UserAuth, isAdmin, getSectionsByReadingTest)

//Paragraph Routes
indexRoutes.post("/addParagraph", UserAuth, isAdmin, addParagraph)
indexRoutes.get("/getAllParagraphs", UserAuth, getAllParagraphs)
indexRoutes.get("/getParagraphById/:id", UserAuth, getParagraphById)
indexRoutes.put("/updateParagraph/:id", UserAuth, isAdmin, updateParagraph)
indexRoutes.delete("/deleteParagraph/:id", UserAuth, isAdmin, deleteParagraph)
indexRoutes.get("/getParagraphsBySection/:readingSectionId", UserAuth, isAdmin, getParagraphsBySection)

//Question Routes
indexRoutes.post("/addQuestion", UserAuth, isAdmin, addQuestion)
indexRoutes.get("/getAllQuestions", UserAuth, getAllQuestions)
indexRoutes.get("/getQuestionById/:id", UserAuth, getQuestionById)
indexRoutes.put("/updateQuestion/:id", UserAuth, isAdmin, updateQuestion)
indexRoutes.delete("/deleteQuestion/:id", UserAuth, isAdmin, deleteQuestion)
indexRoutes.post("/checkBulkUserAnswers", UserAuth, isUser, checkBulkUserAnswers)
indexRoutes.get("/getSectionCorrectAnswers/:readingSectionId", UserAuth, getSectionCorrectAnswers)

//userAnswer Routes
indexRoutes.post("/submitSectionAnswers", UserAuth, isUser, submitSectionAnswers)
indexRoutes.post("/checkUserAnswer", UserAuth,  checkUserAnswer)


export default indexRoutes