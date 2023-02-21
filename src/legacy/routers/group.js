const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const router = new express.Router();

// schema
const Group = require("../models/group");
const User = require("../models/user");
const Noti = require("../models/noti");

// middleware
const auth = require("../authentication/auth");

// modules
const { photoUpload } = require("../modules/photo");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/img"
    ) {
        cb(null, true);
    }
    cb(null, false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10000000 } });

router.post("/groups", upload.single("profile"), auth, async (req, res) => {
    try {
        if (req.file) {
            const profile = await photoUpload(req.file);

            const group = await new Group({
                ...req.body,
                admin: req.user,
                profile
            });

            await group.save();
            res.status(201).json(group);
        } else {
            const group = await new Group({
                ...req.body,
                admin: req.user
            });

            await group.save();
            res.status(201).json(group);
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/groups", auth, async (req, res) => {
    try {
        await req.user.populate({
            path: "groups"
        });
        const groups = req.user.groups;

        res.json({ groups });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/groups/:id", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate("admin");

        res.json(group);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post(
    "/group_profile",
    upload.single("profile"),
    auth,
    async (req, res) => {
        try {
            const group = await Group.findById(req.body._id);
            
            const url = await photoUpload(req.file);

            group.profile = url;

            await group.save();

            res.json(group);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
);

router.patch("/group/:id", upload.single("profile"), auth, async (req, res) => {
    const group = await Group.findById(req.params.id);

    if (!group) throw new Error("Group not found!");

    if (!group.admin === req.user._id) throw new Error("You're not the admin of this group!");

    const updates = Object.keys(req.body);
    const validUpdates = ["name", "description", "profile"];

    const validOperation = updates.every(item => validUpdates.includes(item));

    if (!validOperation) return res.status(400).send();

    try {
        if (req.file) {
            const url = await photoUpload(req.file);

            group.profile = url;

            updates.forEach(update => (group[update] = req.body[update]));

            await group.save();
            res.json(group);
        } else {
            updates.forEach(update => (group[update] = req.body[update]));

            await group.save();
            res.json(group);
        }
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.delete("/groups/:id", auth, async (req, res) => {
    const group = await Group.findById(req.params.id);

    if (!group) throw new Error("Group not found!");

    if (!group.admin === req.user._id) throw new Error("You're not the admin of this group!");

    try {
        await group.remove();

        res.json(group);
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.get("/requested_members/:id", auth, async (req, res) => {
    try {
        const group = await Group.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requested_members._id",
                    foreignField: "_id",
                    as: "requested_members"
                }
            }
        ]);

        if (group.length < 1)
            throw new Error("group not found!");

        const isAdmin = group[0].admin.toString() === req.user._id.toString();

        if (!isAdmin) throw new Error("You're not a admin of this group.");

        res.json({ requested_members: group[0].requested_members, count: group[0].requested_members.length });
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.post("/remove_requested_member", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.body.group_id);

        if (!group) throw new Error("group not found!");

        const isAdmin = group.admin.toString() === req.user._id.toString();

        if (!isAdmin) throw new Error("You're not a admin of this group.");

        group.requested_members = group.requested_members.filter(
            member => member._id.toString() !== req.body.user_id.toString()
        );

        await group.save();

        res.json(group);
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.post("/accept_member", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.body.group_id);

        if (!group) throw new Error("group not found!");

        const isAdmin = group.admin.toString() === req.user._id.toString();

        if (!isAdmin) throw new Error("You're not a admin of this group.");

        group.members = await group.members.concat({ _id: req.body.user_id });

        await group.requested_members.remove({ _id: req.body.user_id });

        await group.save();

        const notification = "admin accepted your request to join " + group.name;

        const noti = await new Noti({
            user: req.body.user_id,
            notification
        });
        await noti.save();

        res.json(group);
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.get("/members/:id", auth, async (req, res) => {
    try {
        const group = await Group.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.params.id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members._id",
                    foreignField: "_id",
                    as: "members"
                }
            }
        ]);

        if (group.length < 1) throw new Error("group not found!");

        const isAdmin = group[0].admin.toString() === req.user._id.toString();

        if (!isAdmin) throw new Error("You're not a admin of this group.");

        res.json({ members: group[0].members, count: group[0].members.length });
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        
        else if( e.message === "You're not the admin of this group!" ) {
            return res.status(401).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.post("/remove_member", auth, async (req, res) => {
    const group = await Group.findById(req.body.group_id);

    if (!group) return res.status(404).send();

    const admin = group.admin.toString() === req.user._id.toString();

    if (!admin) return res.status(401).send();

    const user = await User.findById(req.body.user_id);

    if (!user) return res.status(404).send();

    try {
        await group.members.remove({ _id: user._id });
        await group.save();

        res.send(group);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get("/all_groups", async (req, res) => {
    try {
        const groups = await Group.find({});

        res.json({ groups });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/search_groups/:name", auth, async (req, res) => {
    try {
        const groups = await Group.find({
            $text: { $search: req.params.name }
        });

        res.json({ groups });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/joined_groups", auth, async (req, res) => {
    try {
        const groups = await Group.aggregate([
            {
                $match: {
                    "members._id": req.user._id
                }
            }
        ]);
        res.json({ groups });
    } catch(e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
