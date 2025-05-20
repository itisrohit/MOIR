import express from 'express';
import { getChatList, getMessages, sendMessage } from '../controllers/conversation.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(verifyJWT);

// Get list of all conversations for current user
router.get('/chatlist', getChatList);

// Get messages for a specific conversation
router.get('/get/:conversationId', getMessages);

// Send a message in a conversation
router.post('/send/:conversationId', sendMessage);

export default router;