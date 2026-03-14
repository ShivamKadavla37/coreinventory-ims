const express = require('express');
const { Notification } = require('../models');

const router = express.Router();

// GET /api/notifications
// Fetch recent notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20, // Recent 20 notifications globally
    });
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read
// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification.' });
  }
});

// PUT /api/notifications/read-all
// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { isRead: false } });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to clear notifications.' });
  }
});

module.exports = router;
