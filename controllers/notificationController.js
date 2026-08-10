const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc  Scheduler pushes a notification record here after it computes what's due
//        and (optionally) after it dispatches SMS/WhatsApp/Email.
// @route POST /api/notifications/ingest
// @access Scheduler (x-scheduler-key)
const ingestNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body);
  res.status(201).json({ success: true, data: notification });
});

// @desc  Notification center feed for the logged-in user
// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { "recipients.user": req.user._id };
  if (unreadOnly === "true") query.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

module.exports = { ingestNotification, getNotifications, markAsRead };
