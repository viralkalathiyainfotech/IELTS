import express from "express";
import { upload, convertJfifToJpeg, listeningAudioUpload, speakingAudioUpload } from "../middlewares/imageupload.js";
import { isAdmin, isUser, UserAuth, isPremiumUser } from "../middlewares/auth.js";
import { createRegister, getRegisterById, getAllUsers, updateProfileUser, updateProfileAdmin, getAllUserTestResults } from "../controllers/registerController.js";
import { changePassword, forgotPassword, googleLogin, loginUser, resetPassword, VerifyEmail } from '../controllers/loginController.js';
import { addAbout, deleteAbout, getAboutById, getAllAbout, updateAbout } from "../controllers/aboutController.js";
import { addPrivacyPolicy, deletePrivacyPolicy, getAllPrivacyPolicy, getPrivacyPolicyById, updatePrivacyPolicy } from "../controllers/privacyPolicyController.js";
import { createPremium, deletePremium, getAllPremium, getPremiumById, updatePremium } from "../controllers/premiumController.js";
import { createPayment, deletePayment, getAllPayments, getMySubscription, getPaymentById, updatePayment } from "../controllers/paymentController.js";
import { addTestDetails, deleteTestDetails, getAllTestDetails, getTestDetailsById, updateTestDetails } from "../controllers/testDetailsController.js";
import { addReadingTest, deleteReadingTest, getAllReadingTest, getReadingTestById, updateReadingTest } from "../controllers/readingTestController.js";
import { addReadingSection, deleteReadingSection, getAllReadingSection, getReadingSectionById, getSectionsByReadingTest, updateReadingSection } from "../controllers/readingSectionController.js";
import { addParagraph, deleteParagraph, getAllParagraphs, getParagraphById, getParagraphsBySection, updateParagraph } from "../controllers/paragraphController.js";
import { addReadingQuestion, deleteReadingQuestion, getAllReadingQuestions, getReadingQuestionById, getReadingQuestionBySection, getReadingSectionCorrectAnswers, updateReadingQuestion } from "../controllers/readingQuestionController.js";
import { checkAndSubmitReadingAnswers, getAllReadingTestResults } from "../controllers/readingUserAnswerController.js";
import { addWritingTest, deleteWritingTest, getAllWritingTest, getWritingTestById, updateWritingTest } from "../controllers/writingTestController.js";
import { addWritingSection, deleteWritingSection, getAllWritingSection, getWritingSectionById, updateWritingSection } from "../controllers/writingSectionController.js";
import { addWritingQuestion, deleteWritingQuestion, getAllWritingQuestions, getWritingQuestionById, updateWritingQuestion, getWritingSectionCorrectAnswers, getWritingQuestionBySection } from "../controllers/writingQuestionController.js";
import { checkAndSubmitWritingAnswers, getAllWritingTestResults } from "../controllers/writingUserAnswerController.js";
import { addListeningTest, deleteListeningTest, getAllListeningTest, getListeningTestById, updateListeningTest } from "../controllers/listeningTestController.js";
import { addListeningSection, deleteListeningSection, getAllListeningSection, getListeningSectionById, getSectionsByListeningTest, updateListeningSection } from "../controllers/listeningSectionController.js";
import { createListeningAudio, getAllListeningAudios, getListeningAudioById, updateListeningAudio, deleteListeningAudio, getAudioBySection } from '../controllers/listeningAudioController.js';
import { addListeningQuestion, deleteListeningQuestion, getAllListeningQuestions, getListeningQuestionById, getListeningQuestionBySection, getListeningSectionCorrectAnswers, updateListeningQuestion } from "../controllers/listeningQuestionController.js";
import { checkAndSubmitListeningAnswers, getAllListeningTestResults } from "../controllers/listeningUserAnswerController.js";
import { createSpekingTest, deleteSpeakingTest, getAllSpeakingTest, getSpeakingTestById, updateSpeakingTest } from "../controllers/speakingTestController.js";
import { addSpeakingTopic, deleteSpeakingTopic, getAllSpeakingTopic, getSpeakingTopicById, updateSpeakingTopic } from "../controllers/speakingTopicController.js";
import { addSpeakingQuestion, deleteSpeakingQuestion, getAllSpeakingQuestions, getSpeakingQuestionById, getSpeakingQuestionBySection, getSpeakingSectionCorrectAnswers, updateSpeakingQuestion } from "../controllers/speakingQuestionController.js";
import { checkAndSubmitSpeakingAnswer, getAllSpeakingTestResults } from "../controllers/speakingUserAnswerController.js";


const indexRoutes = express.Router()

//Regitser Routes
indexRoutes.post("/createRegister", createRegister)
indexRoutes.get("/getRegisterById/:id", UserAuth, getRegisterById)
indexRoutes.get("/getAllUsers", UserAuth, getAllUsers)
indexRoutes.put("/updateProfileUser/:id", UserAuth, isUser, upload.single("image"), convertJfifToJpeg, updateProfileUser)
indexRoutes.put("/updateProfileAdmin/:id", UserAuth, isAdmin, upload.single("image"), convertJfifToJpeg, updateProfileAdmin)
indexRoutes.get("/getAllUserTestResults", UserAuth, getAllUserTestResults)

//login Routes
indexRoutes.post('/loginUser', loginUser);
indexRoutes.post('/googleLogin', googleLogin);
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


///////////////////////////////////////////////////// ReadigTest /////////////////////////////////////////////////////////

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
indexRoutes.get("/getSectionsByReadingTest/:readingTestId", UserAuth,  getSectionsByReadingTest)

//Paragraph Routes
indexRoutes.post("/addParagraph", UserAuth, isAdmin, addParagraph)
indexRoutes.get("/getAllParagraphs", UserAuth, getAllParagraphs)
indexRoutes.get("/getParagraphById/:id", UserAuth, getParagraphById)
indexRoutes.put("/updateParagraph/:id", UserAuth, isAdmin, updateParagraph)
indexRoutes.delete("/deleteParagraph/:id", UserAuth, isAdmin, deleteParagraph)
indexRoutes.get("/getParagraphsBySection/:readingSectionId", UserAuth, getParagraphsBySection)

//ReadingQuestion Routes
indexRoutes.post("/addQuestion", UserAuth, isAdmin, addReadingQuestion)
indexRoutes.get("/getAllQuestions", UserAuth, getAllReadingQuestions)
indexRoutes.get("/getQuestionById/:id", UserAuth, getReadingQuestionById)
indexRoutes.get("/getReadingQuestionBySection/:readingSectionId", UserAuth, getReadingQuestionBySection)
indexRoutes.put("/updateQuestion/:id", UserAuth, isAdmin, updateReadingQuestion)
indexRoutes.delete("/deleteQuestion/:id", UserAuth, isAdmin, deleteReadingQuestion)
indexRoutes.get("/getReadingSectionCorrectAnswers/:readingSectionId", UserAuth, isPremiumUser, getReadingSectionCorrectAnswers)

//userAnswer Routes
indexRoutes.post("/checkAndSubmitReadingAnswers", UserAuth, isUser, checkAndSubmitReadingAnswers)
indexRoutes.get("/getAllReadingTestResults", UserAuth, getAllReadingTestResults)


///////////////////////////////////////////////////// WritingTest /////////////////////////////////////////////////////////


//writingTest Routes
indexRoutes.post("/addWritingTest", UserAuth, isAdmin, addWritingTest)
indexRoutes.get("/getAllWritingTest", UserAuth, isPremiumUser, getAllWritingTest)
indexRoutes.get("/getWritingTestById/:id", UserAuth, isPremiumUser, getWritingTestById)
indexRoutes.put("/updateWritingTest/:id", UserAuth, isAdmin, updateWritingTest)
indexRoutes.delete("/deleteWritingTest/:id", UserAuth, isAdmin, deleteWritingTest)

//writingSection Routes
indexRoutes.post("/addWritingSection", UserAuth, isAdmin, upload.single("writing_title_image"), convertJfifToJpeg, addWritingSection)
indexRoutes.get("/getAllWritingSection", UserAuth, isPremiumUser, getAllWritingSection)
indexRoutes.get("/getWritingSectionById/:id", UserAuth, isPremiumUser, getWritingSectionById)
indexRoutes.put("/updateWritingSection/:id", UserAuth, isAdmin, upload.single("writing_title_image"), convertJfifToJpeg, updateWritingSection)
indexRoutes.delete("/deleteWritingSection/:id", UserAuth, isAdmin, deleteWritingSection)

//writingQuestion Routes
indexRoutes.post("/addWritingQuestion", UserAuth, isAdmin, upload.single("writing_question_image"), convertJfifToJpeg, addWritingQuestion);
indexRoutes.get("/getAllWritingQuestions", UserAuth, isPremiumUser, getAllWritingQuestions)
indexRoutes.get("/getWritingQuestionById/:id", UserAuth, isPremiumUser, getWritingQuestionById)
indexRoutes.get("/getWritingQuestionBySection/:writingSectionId", UserAuth, isPremiumUser, getWritingQuestionBySection)
indexRoutes.put("/updateWritingQuestion/:id", UserAuth, isAdmin, upload.single("writing_question_image"), convertJfifToJpeg, updateWritingQuestion)
indexRoutes.delete("/deleteWritingQuestion/:id", UserAuth, isAdmin, deleteWritingQuestion)
indexRoutes.get("/getWritingSectionCorrectAnswers/:writingSectionId", UserAuth, isPremiumUser, getWritingSectionCorrectAnswers)


//writingUserAnswer Routes
indexRoutes.post("/checkAndSubmitWritingAnswers", UserAuth, isUser, checkAndSubmitWritingAnswers)
indexRoutes.get("/getAllWritingTestResults", UserAuth, getAllWritingTestResults)


///////////////////////////////////////////////////// ListeningTest /////////////////////////////////////////////////////////


//ListeningTest Routes
indexRoutes.post("/addListeningTest", UserAuth, isAdmin, addListeningTest)
indexRoutes.get("/getAllListeningTest", UserAuth, isPremiumUser, getAllListeningTest)
indexRoutes.get("/getListeningTestById/:id", UserAuth, isPremiumUser, getListeningTestById)
indexRoutes.put("/updateListeningTest/:id", UserAuth, isAdmin, updateListeningTest)
indexRoutes.delete("/deleteListeningTest/:id", UserAuth, isAdmin, deleteListeningTest)

//ListeningSection Routes
indexRoutes.post("/addListeningSection", UserAuth, isAdmin, addListeningSection)
indexRoutes.get("/getAllListeningSection", UserAuth, isPremiumUser, getAllListeningSection)
indexRoutes.get("/getListeningSectionById/:id", UserAuth, isPremiumUser, getListeningSectionById)
indexRoutes.put("/updateListeningSection/:id", UserAuth, isAdmin, updateListeningSection)
indexRoutes.delete("/deleteListeningSection/:id", UserAuth, isAdmin, deleteListeningSection)
indexRoutes.get("/getSectionsByListeningTest/:listeningTestId", UserAuth, isAdmin, getSectionsByListeningTest)

//ListeningAudio Routes
indexRoutes.post('/createListeningAudio', UserAuth, isAdmin, listeningAudioUpload.single('listeningAudio'), createListeningAudio);
indexRoutes.get('/getAllListeningAudios', UserAuth, isPremiumUser, getAllListeningAudios);
indexRoutes.get('/getListeningAudioById/:id', UserAuth, isPremiumUser, getListeningAudioById);
indexRoutes.put('/updateListeningAudio/:id', UserAuth, isAdmin, listeningAudioUpload.single('listeningAudio'), updateListeningAudio);
indexRoutes.delete('/deleteListeningAudio/:id', UserAuth, isAdmin, deleteListeningAudio);
indexRoutes.get("/getAudioBySection/:listeningSectionId", UserAuth, isAdmin, getAudioBySection)

//listeningQuestion Routes
indexRoutes.post("/addListeningQuestion", UserAuth, isAdmin, addListeningQuestion);
indexRoutes.get("/getAllListeningQuestions", UserAuth, isPremiumUser, getAllListeningQuestions)
indexRoutes.get("/getListeningQuestionById/:id", UserAuth, isPremiumUser, getListeningQuestionById)
indexRoutes.get("/getListeningQuestionBySection/:listeningSectionId", UserAuth, getListeningQuestionBySection)
indexRoutes.put("/updateListeningQuestion/:id", UserAuth, isAdmin, updateListeningQuestion)
indexRoutes.delete("/deleteListeningQuestion/:id", UserAuth, isAdmin, deleteListeningQuestion)
indexRoutes.get("/getListeningSectionCorrectAnswers/:listeningSectionId", UserAuth, isPremiumUser, getListeningSectionCorrectAnswers)

//writingUserAnswer Routes
indexRoutes.post("/checkAndSubmitListeningAnswers", UserAuth, isPremiumUser, checkAndSubmitListeningAnswers)
indexRoutes.get("/getAllListeningTestResults", UserAuth, getAllListeningTestResults)


///////////////////////////////////////////////////// SpeakingTest /////////////////////////////////////////////////////////


//SpeakingTest Routes
indexRoutes.post("/createSpekingTest", UserAuth, isAdmin, createSpekingTest)
indexRoutes.get("/getAllSpeakingTest", UserAuth, isPremiumUser, getAllSpeakingTest)
indexRoutes.get("/getSpeakingTestById/:id", UserAuth, isPremiumUser, getSpeakingTestById)
indexRoutes.put("/updateSpeakingTest/:id", UserAuth, isAdmin, updateSpeakingTest)
indexRoutes.delete("/deleteSpeakingTest/:id", UserAuth, isAdmin, deleteSpeakingTest)

//SpeakingTopic Routes
indexRoutes.post("/addSpeakingTopic", UserAuth, isAdmin, addSpeakingTopic)
indexRoutes.get("/getAllSpeakingTopic", UserAuth, isPremiumUser, getAllSpeakingTopic)
indexRoutes.get("/getSpeakingTopicById/:id", UserAuth, isPremiumUser, getSpeakingTopicById)
indexRoutes.put("/updateSpeakingTopic/:id", UserAuth, isAdmin, updateSpeakingTopic)
indexRoutes.delete("/deleteSpeakingTopic/:id", UserAuth, isAdmin, deleteSpeakingTopic)

//SpeakingQuestion Routes
indexRoutes.post("/addSpeakingQuestion", UserAuth, isAdmin, addSpeakingQuestion);
indexRoutes.get("/getAllSpeakingQuestions", UserAuth, isPremiumUser, getAllSpeakingQuestions)
indexRoutes.get("/getSpeakingQuestionById/:id", UserAuth, isPremiumUser, getSpeakingQuestionById)
indexRoutes.get("/getSpeakingQuestionBySection/:speakingTopicId", UserAuth, isPremiumUser, getSpeakingQuestionBySection)
indexRoutes.put("/updateSpeakingQuestion/:id", UserAuth, isAdmin, updateSpeakingQuestion)
indexRoutes.delete("/deleteSpeakingQuestion/:id", UserAuth, isAdmin, deleteSpeakingQuestion)
indexRoutes.get("/getSpeakingSectionCorrectAnswers/:speakingTopicId", UserAuth, isPremiumUser, getSpeakingSectionCorrectAnswers)

//SpeakingUserAnswer Routes
indexRoutes.post("/checkAndSubmitSpeakingAnswer", UserAuth, isUser, isPremiumUser, speakingAudioUpload.single('speakingAudio'), checkAndSubmitSpeakingAnswer)
indexRoutes.get("/getAllSpeakingTestResults", UserAuth, isPremiumUser, getAllSpeakingTestResults)


export default indexRoutes  