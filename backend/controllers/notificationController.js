const db = require('../config/db');

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await db.all(
      `SELECT id, user_id, place_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('GetNotifications error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching notifications.'
    });
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID.'
      });
    }

    // Ensure notification exists and belongs to the authenticated user
    const notification = await db.get(
      `SELECT id, user_id, is_read FROM notifications WHERE id = ?`,
      [notificationId]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You cannot modify notifications belonging to another user.'
      });
    }

    await db.run(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [notificationId]
    );

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('MarkAsRead error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating notification.'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
