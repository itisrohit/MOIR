import { Response } from 'express';
import { Friend, FriendshipStatus, } from '../models/friend.model';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../utils/types/auth.types';
import { FriendDocument, PopulatedFriendDocument, UserDocument } from '../utils/types/friend.types';

// Send a friend request
export const sendFriendRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { emailorusername } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (!emailorusername || typeof emailorusername !== 'string') {
      throw new ApiError(400, "Username or email  is required");
    }

    // Determine if emailorusername is email or username
    const isEmail = emailorusername.includes('@');
    
    // Find recipient by username or email
    const query = isEmail ? { email: emailorusername } : { username: emailorusername };
    const recipientUser = await User.findOne(query) as UserDocument | null;
    
    if (!recipientUser) {
      throw new ApiError(404, "User not found");
    }

    const recipientId = recipientUser._id;

    // Check if trying to add self as friend
    if (userId.toString() === recipientId.toString()) {
      throw new ApiError(400, "Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        // If recipient already sent request to current user, accept it automatically
        if (existingFriendship.recipient.toString() === userId.toString()) {
          existingFriendship.status = FriendshipStatus.ACCEPTED;
          existingFriendship.acceptanceRead = false; // Notify original requester
          await existingFriendship.save();
          
          return res.status(200).json(
            new ApiResponse(
              200,
              { friendship: existingFriendship },
              "Friend request accepted"
            )
          );
        }
        throw new ApiError(400, "Friend request already pending");
      }
      
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ApiError(400, "Already friends with this user");
      }
      
      if (existingFriendship.status === FriendshipStatus.REJECTED) {
        // If previously rejected, update to pending
        existingFriendship.status = FriendshipStatus.PENDING;
        existingFriendship.requestRead = false;
        await existingFriendship.save();
        
        return res.status(200).json(
          new ApiResponse(
            200,
            { friendship: existingFriendship },
            "Friend request sent"
          )
        );
      }
    }

    // Create new friend request
    const newFriendship = await Friend.create({
      requester: userId,
      recipient: recipientId,
      status: FriendshipStatus.PENDING,
      requestRead: false
    }) as unknown as FriendDocument;

    res.status(201).json(
      new ApiResponse(
        201,
        { friendship: newFriendship },
        "Friend request sent"
      )
    );
  }
);

// Accept or reject a friend request
export const respondToFriendRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { friendshipId } = req.params;
    const { accept } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Find the friendship and ensure user is recipient
    const friendship = await Friend.findOne({
      _id: friendshipId,
      recipient: userId,
      status: FriendshipStatus.PENDING
    }) as unknown as FriendDocument;

    if (!friendship) {
      throw new ApiError(404, "Friend request not found or already processed");
    }

    // Mark request as read
    friendship.requestRead = true;
    
    // Update status based on response
    if (accept === true) {
      friendship.status = FriendshipStatus.ACCEPTED;
      friendship.acceptanceRead = false; // Requester needs to be notified
    } else {
      friendship.status = FriendshipStatus.REJECTED;
    }

    await friendship.save();

    res.status(200).json(
      new ApiResponse(
        200,
        { friendship },
        accept ? "Friend request accepted" : "Friend request rejected"
      )
    );
  }
);



// Get all friends
export const getFriends = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Find all accepted friendships where user is either requester or recipient
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: FriendshipStatus.ACCEPTED },
        { recipient: userId, status: FriendshipStatus.ACCEPTED }
      ]
    })
    .populate('requester', 'name username image status')
    .populate('recipient', 'name username image status')
    .sort({ updatedAt: -1 }) as unknown as PopulatedFriendDocument[];

    // Format friends list
    const friends = friendships.map(friendship => {
      // Determine which user is the friend (not the current user)
      const isFriendRequester = friendship.recipient._id.toString() === userId.toString();
      const friend = isFriendRequester ? friendship.requester : friendship.recipient;
      
      return {
        id: friendship._id,
        userId: friend._id,
        name: friend.name,
        username: friend.username,
        image: friend.image,
        status: friend.status,
        friendshipDate: friendship.updatedAt
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        { friends },
        "Friends fetched successfully"
      )
    );
  }
);

// Get all notifications (requests + acceptances) with optional filtering
export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { type } = req.query; // Optional: 'requests', 'acceptances', or undefined for all

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Update the notification data structure
    const notificationsData: {
      requests?: any[];
      acceptances?: any[];
      unreadCounts: {  // Renamed from "counts" to "unreadCounts"
        total: number;
        requests: number;
        acceptances: number;
      }
    } = {
      unreadCounts: {  // Renamed from "counts" to "unreadCounts" 
        total: 0,
        requests: 0,
        acceptances: 0
      }
    };

    // Get unread requests if needed
    if (!type || type === 'requests') {
      const requests = await Friend.find({
        recipient: userId,
        status: FriendshipStatus.PENDING,
        requestRead: false
      })
      .populate('requester', 'name username image status')
      .sort({ createdAt: -1 }) as unknown as PopulatedFriendDocument[];

      notificationsData.requests = requests.map(request => ({
        id: request._id,
        type: 'request',
        user: request.requester,
        createdAt: request.createdAt
      }));

      // Update references to the counts property
      notificationsData.unreadCounts.requests = notificationsData.requests.length;
    }

    // Get unread acceptances if needed
    if (!type || type === 'acceptances') {
      const acceptances = await Friend.find({
        requester: userId,
        status: FriendshipStatus.ACCEPTED,
        acceptanceRead: false
      })
      .populate('recipient', 'name username image status')
      .sort({ updatedAt: -1 }) as unknown as PopulatedFriendDocument[];

      notificationsData.acceptances = acceptances.map(acceptance => ({
        id: acceptance._id,
        type: 'acceptance',
        user: acceptance.recipient,
        acceptedAt: acceptance.updatedAt
      }));

      // Update references to the counts property
      notificationsData.unreadCounts.acceptances = notificationsData.acceptances.length;
    }

    // Calculate total count
    notificationsData.unreadCounts.total = 
      notificationsData.unreadCounts.requests + notificationsData.unreadCounts.acceptances;

    res.status(200).json(
      new ApiResponse(
        200,
        notificationsData,
        "Notifications fetched successfully"
      )
    );
  }
);

// Mark notifications as read
export const markNotificationsAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { type, ids } = req.body;
    // type: 'requests', 'acceptances', or 'all'
    // ids: optional array of specific notification IDs to mark as read
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (!type || !['requests', 'acceptances', 'all'].includes(type)) {
      throw new ApiError(400, "Invalid notification type");
    }

    const updates = { updatedAt: new Date() };
    const updateResults = {
      requests: 0,
      acceptances: 0,
      total: 0
    };

    // Mark friend requests as read
    if (type === 'requests' || type === 'all') {
      const requestQuery: any = {
        recipient: userId,
        status: FriendshipStatus.PENDING,
        requestRead: false
      };
      
      // If specific IDs are provided, add them to the query
      if (ids && ids.length > 0) {
        requestQuery._id = { $in: ids };
      }
      
      const requestResult = await Friend.updateMany(
        requestQuery,
        { requestRead: true, ...updates }
      );
      
      updateResults.requests = requestResult.modifiedCount;
    }

    // Mark acceptances as read
    if (type === 'acceptances' || type === 'all') {
      const acceptanceQuery: any = {
        requester: userId,
        status: FriendshipStatus.ACCEPTED,
        acceptanceRead: false
      };
      
      // If specific IDs are provided, add them to the query
      if (ids && ids.length > 0) {
        acceptanceQuery._id = { $in: ids };
      }
      
      const acceptanceResult = await Friend.updateMany(
        acceptanceQuery,
        { acceptanceRead: true, ...updates }
      );
      
      updateResults.acceptances = acceptanceResult.modifiedCount;
    }

    updateResults.total = updateResults.requests + updateResults.acceptances;

    res.status(200).json(
      new ApiResponse(
        200,
        updateResults,
        `${updateResults.total} notifications marked as read`
      )
    );
  }
);

// Get friend requests - can fetch incoming, outgoing, or both
export const getFriendRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { direction = 'all' } = req.query; // 'incoming', 'outgoing', or 'all'

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    const result: {
      incoming?: any[];
      outgoing?: any[];
    } = {};

    // Get incoming requests if needed
    if (direction === 'incoming' || direction === 'all') {
      const incomingRequests = await Friend.find({
        recipient: userId,
        status: FriendshipStatus.PENDING
      })
      .populate('requester', 'name username image status')
      .sort({ createdAt: -1 }) as unknown as PopulatedFriendDocument[];

      result.incoming = incomingRequests.map(request => ({
        id: request._id,
        user: request.requester,
        createdAt: request.createdAt,
        isRead: request.requestRead
      }));
    }

    // Get outgoing requests if needed
    if (direction === 'outgoing' || direction === 'all') {
      const outgoingRequests = await Friend.find({
        requester: userId,
        status: FriendshipStatus.PENDING
      })
      .populate('recipient', 'name username image status')
      .sort({ createdAt: -1 }) as unknown as PopulatedFriendDocument[];

      result.outgoing = outgoingRequests.map(request => ({
        id: request._id,
        user: request.recipient,
        createdAt: request.createdAt
      }));
    }

    res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Friend requests fetched successfully"
      )
    );
  }
);