import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { 
  sendFriendRequest, 
  respondToFriendRequest,
  getIncomingFriendRequests, 
  getOutgoingFriendRequests,
  getFriends,
  getNotifications,
  markNotificationsAsRead
} from '../controllers/friend.controller';

const router = express.Router();

router.use(verifyJWT);

// Friend management endpoints
router.post('/send', sendFriendRequest);
router.post('/:friendshipId/respond', respondToFriendRequest);

// Friend list endpoints
router.get('/list', getFriends);
router.get('/requests/incoming', getIncomingFriendRequests);
router.get('/requests/outgoing', getOutgoingFriendRequests);


router.get('/notifications', getNotifications);
router.post('/notifications/mark-read', markNotificationsAsRead);

export default router;