import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { 
  sendFriendRequest, 
  respondToFriendRequest,
  getFriendRequests,
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
router.get('/requests', getFriendRequests);


router.get('/notifications', getNotifications);
router.post('/notifications/mark-read', markNotificationsAsRead);

export default router;