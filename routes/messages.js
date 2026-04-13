var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});
var rateLimit = require('express-rate-limit');

const db = require('../Database');
const { validateCsrfFromHeader, generateToken } = require('../middleware/csrf');
const { log, securityLog, getClientIp } = require('../logger');
const { requirePermission, PERMISSIONS, isOwner, getUserId } = require('../middleware/auth');

// Rate limiter for sending messages,to prevent spam, 
// so attackers cant crash our service by sending too many messages in a short period of time. 
// We set a limit of 10 messages per minute per user.
const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: { error: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for message requests
const messageRequestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// The main messages page, it require VIEW_MESSAGES permission. users need to be logged in to access messages,
router.get('/', requirePermission(PERMISSIONS.VIEW_MESSAGES), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.redirect('/login');
  }

  // Ensure CSRF token is available
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;

  try {
    const conversations = await db.getConversations(user_id);

    // create conversations with user info
    const conversationsWithInfo = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await db.getUserById(conv.other_user_id);
        if (!otherUser) return null;
        const otherProfile = await db.getProfileByUserId(conv.other_user_id);
        const unreadCount = await db.getUnreadCount(user_id, conv.other_user_id);
        return {
          ...conv,
          user: otherUser,
          profile: otherProfile,
          unreadCount,
        };
      }),
    );
    const validConversations = conversationsWithInfo.filter((c) => c !== null);

    res.render('messages', {
      conversations: validConversations,
      currentUserId: user_id,
      selectedUserId: null,
      messages: [],
    });
  } catch (err) {
    log(`MESSAGES: Error loading conversations - ${err.message}`);
    next(err);
  }
});

// here we conversation with specific user
router.get('/user/:id', async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.redirect('/login');
  }

  const otherUserId = parseInt(req.params.id);
  if (isNaN(otherUserId) || otherUserId === user_id) {
    return res.redirect('/messages');
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;

  try {
    // here we verify the other user exists and we have a aggred from users to message with each other.
    const otherUser = await db.getUserById(otherUserId);
    if (!otherUser) {
      // User no longer exists, redirect to messages list
      return res.redirect('/messages');
    }

    // Check if we have a connection
    const hasConnection = await db.hasMessageConnection(user_id, otherUserId);
    if (!hasConnection && !otherUser.is_admin) {
      // If no connection, redirect to messages
      return res.redirect('/messages');
    }

    // Get conversation
    const messages = await db.getConversation(user_id, otherUserId);

    // Mark messages as read
    await db.markMessagesAsRead(otherUserId, user_id);

    // Get all conversations for sidebar
    const conversations = await db.getConversations(user_id);
    const conversationsWithInfo = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await db.getUserById(conv.other_user_id);
        if (!otherUser) return null;
        const otherProfile = await db.getProfileByUserId(conv.other_user_id);
        const unreadCount = await db.getUnreadCount(user_id, conv.other_user_id);
        return {
          ...conv,
          user: otherUser,
          profile: otherProfile,
          unreadCount,
        };
      }),
    );
    const validConversations = conversationsWithInfo.filter((c) => c !== null);

    // Get the other user's profile info
    const otherProfile = await db.getProfileByUserId(otherUserId);
    const currentUserProfile = await db.getProfileByUserId(user_id);

    res.render('messages', {
      conversations: validConversations,
      currentUserId: user_id,
      selectedUserId: otherUserId,
      selectedUser: otherUser,
      selectedProfile: otherProfile,
      messages: messages,
      currentUserProfile: currentUserProfile,
    });
  } catch (err) {
    log(`MESSAGES: Error loading conversation - ${err.message}`);
    next(err);
  }
});

// Send a message
router.post('/send', messageRateLimiter, upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { receiverId, content } = req.body;

  if (!receiverId || !content || content.trim() === '') {
    return res.status(400).json({ error: 'Missing receiver or content' });
  }

  const receiverIdNum = parseInt(receiverId);
  if (isNaN(receiverIdNum) || receiverIdNum === user_id) {
    return res.status(400).json({ error: 'Invalid receiver' });
  }

  try {
    // Check if receiver is admin, block messages to admin, we dont want users messaging admins directly to avoid harassment.
    const receiver = await db.getUserById(receiverIdNum);
    if (receiver && receiver.is_admin) {
      return res.status(403).json({ error: 'Cannot send messages to admin' });
    }

    // Check if there's a message connection, request accepted.
    const hasConnection = await db.hasMessageConnection(user_id, receiverIdNum);
    if (!hasConnection) {
      return res
        .status(403)
        .json({ error: 'Message request not accepted. Please send a request first.' });
    }

    // Send the message
    await db.createMessage(user_id, receiverIdNum, content.trim());
    log(`MESSAGE: Sent from user ${user_id} to user ${receiverIdNum}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error sending message:', err);
    log(`MESSAGE: Error sending - ${err.message}, stack: ${err.stack}`);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send message request
router.post('/request', messageRequestLimiter, upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { toUserId } = req.body;
  const toUserIdNum = parseInt(toUserId);

  if (isNaN(toUserIdNum) || toUserIdNum === user_id) {
    console.log('DEBUG - Invalid toUserId');
    return res.status(400).json({ error: 'Invalid user' });
  }

  try {
    // Check if target user is admin, block requests to admin to avoid harassment
    const receiver = await db.getUserById(toUserIdNum);
    if (receiver && receiver.is_admin) {
      return res.status(403).json({ error: 'Cannot send message requests to admin' });
    }

    // Create message request
    const result = await db.createMessageRequest(user_id, toUserIdNum);
    if (result.exists) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    log(`MESSAGE REQUEST: Created request from user ${user_id} to user ${toUserIdNum}`);
    res.json({ success: true });
  } catch (err) {
    log(`MESSAGE REQUEST: Error - ${err.message}`);
    next(err);
  }
});

// Get message requests page
router.get('/requests', async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.redirect('/login');
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;

  try {
    const requests = await db.getMessageRequests(user_id);
    res.render('messageRequests', { requests, currentUserId: user_id });
  } catch (err) {
    log(`MESSAGE REQUESTS: Error - ${err.message}`);
    next(err);
  }
});

// Accept message request
router.post('/requests/accept', messageRequestLimiter, upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { requestId } = req.body;

  try {
    await db.acceptMessageRequest(requestId, user_id);
    log(`MESSAGE REQUEST: Accepted request ${requestId} by user ${user_id}`);
    return res.redirect('/messages');
  } catch (err) {
    log(`MESSAGE REQUEST: Error accepting - ${err.message}`);
    next(err);
  }
});

// Decline message request
router.post('/requests/decline', messageRequestLimiter, upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { requestId } = req.body;

  try {
    await db.declineMessageRequest(requestId, user_id);
    log(`MESSAGE REQUEST: Declined request ${requestId} by user ${user_id}`);
    return res.redirect('/messages');
  } catch (err) {
    log(`MESSAGE REQUEST: Error declining - ${err.message}`);
    next(err);
  }
});

// Delete conversation / unmatch
router.post('/unmatch', upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { otherUserId } = req.body;
  const otherUserIdNum = parseInt(otherUserId);

  if (isNaN(otherUserIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    await db.deleteConversation(user_id, otherUserIdNum);
    log(`MESSAGES: User ${user_id} unmatched with user ${otherUserIdNum}`);
    return res.json({ success: true });
  } catch (err) {
    log(`MESSAGES: Error unmatching - ${err.message}`);
    next(err);
  }
});

// Block user
router.post('/block', upload.none(), async (req, res, next) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { otherUserId } = req.body;
  const otherUserIdNum = parseInt(otherUserId);

  if (isNaN(otherUserIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    await db.blockUser(user_id, otherUserIdNum);
    await db.deleteConversation(user_id, otherUserIdNum);
    log(`MESSAGES: User ${user_id} blocked user ${otherUserIdNum}`);
    return res.json({ success: true });
  } catch (err) {
    log(`MESSAGES: Error blocking user - ${err.message}`);
    next(err);
  }
});

module.exports = router;
