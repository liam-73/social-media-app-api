const express = require("express");

// schema
const Noti = require("../models/noti");

// middleware
const auth = require("../authentication/auth");

const router = new express.Router();

router.get("/notifications", auth, async (req, res) => {
    try {
         const notifications = await Noti.aggregate([
            { $match: { user: req.user._id } },
            { $sort: { createdAt: -1 } },
            { $project: { notification: 1, read: 1 } }
        ]);

        const read = notifications.filter(item => item.read === true);

        unread_noti = notifications.length - read.length;

        res.json({
            notifications,
            count: notifications.length,
            read_noti: read.length,
            unread_noti
        });
    } catch(e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/read_noti", auth, async (req, res) => {
    try {
        const notification = await Noti.findById(req.body.noti_id);

        if (!notification)
            throw new Error("Notification not found!");

        notification.read = true;

        await notification.save();
        res.json(notification);
    } catch(e) {
        if( e.message === "Notification not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
