/**
 * Chat / Message Routes
 * POST /api/messages              - Send message
 * GET  /api/messages              - Get all conversations list
 * GET  /api/messages/unread/count - Get unread count
 * GET  /api/messages/:userId      - Get conversation with a user
 * DELETE /api/messages/:id        - Delete a message
 */

const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversationList,
  deleteMessage,
  getUnreadCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { messageValidator, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.post('/', messageValidator, sendMessage);
router.get('/', getConversationList);
router.get('/unread/count', getUnreadCount);
router.get('/:userId', getConversation);
router.delete('/:id', mongoIdParam('id'), deleteMessage);

module.exports = router;
