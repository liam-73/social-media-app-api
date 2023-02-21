const express = require("express");
const validator = require("validator");
const bcrypt = require("bcrypt");
const multer = require("multer");
const R = require("ramda");

const router = new express.Router();

// schema
const User = require("../models/user");
const Group = require("../models/group");
const Noti = require("../models/noti");

// authentication
const auth = require("../authentication/auth");
const { authToken } = require("../authentication/generateToken")

// module
const { photoUpload } = require("../modules/photo");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb ) => {
    if( file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/img"
    ) {
        cb(null, true);
    }
    cb(null, false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 1024 * 1024 * 10 } });

router.post("/register", upload.single("avatar"), async (req, res) => {
    const validEmail = validator.isEmail(req.body.email.toLowerCase());

    if (!validEmail) throw new Error({ error: "Invalid Email" });

    const oldUser = await User.findOne({ email: req.body.email });

    if (oldUser) throw new Error({ error: "This email is already used." });

    const user = new User(req.body);

    try {
        await user.save();
        const token = await authToken(user);

        res.status(201).json({ user, token });
    } catch (e) {
        if( e.message === "Invalid Email" ) {
            return res.status(400).json({ message: e.message });
        }
        
        else if( e.message === "This email is already used." ) {
            return res.status(409).json({ message: e.message });
        }

        return res.status(500).json({ message: e.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) throw new Error({ error: "There's no user with this email!" });

        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) throw new Error({ error: "Wrong Password!" });

        const token = await authToken(user);

        res.json({ user, token });
    } catch (e) {
        if( e.message === "There's no user with this email!" ) {
            return res.status(404).json({ message: e.message });
        }

        else if( e.message === "Wrong Password!" ) {
            return res.status(400).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.get("/profile", auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/avatar", upload.single("avatar"), auth, async (req, res) => {
    try {
        const url = await photoUpload(req.file);

        req.user.avatar = {
            url
        };

        await req.user.save();

        res.json(req.user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/cover", upload.single("cover"), auth, async (req, res) => {
    try {
        const url = await photoUpload(req.file);

        req.user.cover = {
            url
        };

        await req.user.save();

        res.json(req.user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.patch("/profile", upload.single("avatar"), auth, async (req, res) => {
    let edits = Object.keys(req.body);
    const validEdits = [
        "name",
        "email",
        "password",
        "dateOfBirth",
        "hometown",
        "bio",
        "avatar",
        "avatarUrl"
    ];

    const validOperation = edits.every(edit => validEdits.includes(edit));

    if (!validOperation) throw new Error("Invalid Input!");

    if (edits.includes("avatarUrl")) {
        edits = edits.filter(item => item !== "avatarUrl");
    }

    if (req.file) {
        try {
            const url = await photoUpload(req.file);

            req.user.avatar = {
                url
            };

            edits.forEach(edit => (req.user[edit] = req.body[edit]));

            await req.user.save();

            res.json(req.user);
        } catch (e) {
            if( e.message === "Invalid Input!" ) {
                return res.status(400).json({ message: e.message });
            }
            res.status(500).json({ message: e.message });
        }
    } else {
        try {
            edits.forEach(edit => (req.user[edit] = req.body[edit]));

            await req.user.save();

            res.json(req.user);
        } catch (e) {
            if( e.message === "Invalid Input!" ) {
                return res.status(400).json({ message: e.message });
            }
            res.status(500).json({ message: e.message });
        }
    }
});

router.delete("/users", auth, async (req, res) => {
    try {
        await req.user.remove();

        res.json({ message: "User deleted!" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        res.json(user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/search_by_name/:name", auth, async (req, res) => {
    try {
        req.user.recent_searches = req.user.recent_searches.concat({
            search: req.params.name
        });

        let users = await User.find({ $text: { $search: req.params.name } });

        if (users.length > 0) {
            req.user.blocked_users.forEach(user => {
                users = users.filter(
                    item => item._id.toString() !== user._id.toString()
                );
            });
        }

        await req.user.save();
        res.json(users);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/request_friend", auth, async (req, res) => {
    try {
        const user = await User.findById(req.body._id);

        if (!user) throw new Error("User not found!");

        user.friends.forEach(user => {
            if (user._id === req.user._id) throw new Error({ message: "you're already friend with this user!" });
        });

        req.user.requested_users = req.user.requested_users.concat({
            _id: user._id
        });

        user.friend_requests = user.friend_requests.concat({
            _id: req.user._id,
            requested_at: new Date()
        });

        await user.save();
        await req.user.save();

        const notification = req.user.name + " sent you a friend request.";

        const noti = await new Noti({
            user: user._id,
            notification
        });
        await noti.save();

        res.json( req.user );
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }

        else if( e.message === "you're already friend with this user!" ) {
            return res.status(409).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.get("/friend_requests", auth, async (req, res) => {
    try {
        await req.user.friend_requests.sort((a, b) =>
            a.requested_at > b.requested_at
                ? -1
                : a.requested_at < b.requested_at
                ? 1
                : 0
        );

        const user = await req.user.populate("friend_requests._id");

        const friend_requests = [];

        await user.friend_requests.forEach(item =>
            friend_requests.push(item._id)
        );

        res.json({ friend_requests, count: friend_requests.length });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/remove_friend_requests", auth, async (req, res) => {
    try {
        const user = await User.findById(req.body._id);

        if (!user) throw new Error({ message: "user not found" });

        req.user.friend_requests = await req.user.friend_requests.remove({
            _id: req.body._id
        });

        user.requested_users = user.requested_users.filter(
            user => user._id.toString() !== req.user._id.toString()
        );

        await user.save();
        await req.user.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }

        res.status(500).json({ message: e.message });
    }
});

router.post("/accept_friend_request", auth, async (req, res) => {
    try {
        const user = await User.findById(req.body._id);

        if (!user) throw new Error("User not found!");

        user.friends = user.friends.concat({ _id: req.user._id });
        await user.save();

        req.user.friends = req.user.friends.concat({ _id: user._id });
        await req.user.friend_requests.remove({ _id: req.body._id });
        await req.user.save();

        const notification = req.user.name + " accepted your friend request.";

        const noti = await new Noti({
            user: user._id,
            notification
        });
        await noti.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.get("/friends", auth, async (req, res) => {
    try {
        const user = await req.user.populate("friends._id");

        const friends = [];

        await user.friends.forEach(item => friends.push(item._id));

        friends.sort((a, b) =>
            a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        );

        res.json({ friends, count: friends.length });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get("/mutual_friends/:id", auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) throw new Error("User not found!");

        const mutual_friendsId = R.intersection(req.user.friends, user.friends);

        const mutual_friends = [];

        for (let i = 0; i < mutual_friendsId.length; i++) {
            const friend = await User.findById(mutual_friendsId[i]);

            mutual_friends.push(friend);
        }

        res.json({ mutual_friends, count: mutual_friends.length });
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.post("/unfriend", auth, async (req, res) => {
    try {
        const user = await User.findById(req.body._id);

        if (!user) throw new Error("User not found!");

        await user.friends.remove({ _id: req.user._id });
        await req.user.friends.remove({ _id: req.body._id });

        await req.user.save();
        await user.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.post("/block", auth, async (req, res) => {
    try {
        const user = await User.findById(req.body._id);

        if (!user) throw new Error("User not found!");

        await user.friends.remove({ _id: req.user._id });
        await req.user.friends.remove({ _id: req.body._id });

        req.user.blocked_users = req.user.blocked_users.concat({
            _id: req.body._id
        });

        await user.save();
        await req.user.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.get("/blocked_users", auth, async (req, res) => {
    try {
        const user = await req.user.populate("blocked_users._id");

        const blocked_users = [];

        await user.blocked_users.forEach(item => blocked_users.push(item._id));

        blocked_users.sort((a, b) =>
            a.name > b.name ? 1 : a.name < b.name ? -1 : 0
        );

        res.json({ blocked_users, count: blocked_users.length });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/unblock", auth, async (req, res) => {
    try {
        await req.user.blocked_users.remove({ _id: req.body._id });

        await req.user.save();

        res.json(req.user);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.post("/request_group", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.body.group);

        if (!group) throw new Error("Group not found!");

        group.requested_members = await group.requested_members.concat({
            _id: req.user._id
        });
        await group.save();

        const notification = req.user.name + " requested to join to group.";

        const noti = await new Noti({
            user: group.admin,
            notification
        });
        await noti.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "Group not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.post("/leave_group", auth, async (req, res) => {
    try {
        const group = await Group.findById(req.body.group_id);

        if (!group) throw new Error("Group not found!");

        await group.members.remove({ _id: req.user._id });

        await group.save();

        res.json(req.user);
    } catch (e) {
        if( e.message === "User not found!" ) {
            return res.status(404).json({ message: e.message });
        }
        res.status(500).json({ message: e.message });
    }
});

router.get("/people_you_may_know", auth, async (req, res) => {
    try {
        let users = await User.find({ _id: { $ne: req.user._id } });

        if (req.user.friend_requests > 0) {
            req.user.friend_requests.forEach(user => {
                users = users.filter(
                    item => item._id.toString() !== user._id.toString()
                );
            });
        }

        if (req.user.friends.length > 0) {
            req.user.friends.forEach(user => {
                users = users.filter(
                    item => item._id.toString() !== user._id.toString()
                );
            });
        }

        if (req.user.blocked_users.length > 0) {
            req.user.blocked_users.forEach(user => {
                users = users.filter(
                    item => item._id.toString() !== user._id.toString()
                );
            });
        }

        req.user.not_interested_users.forEach(user => {
            users = users.filter(
                item => item._id.toString() !== user._id.toString()
            );
        });

        if (req.user.requested_users.length > 0) {
            req.user.requested_users.forEach(user => {
                users = users.filter(
                    item => item._id.toString() !== user._id.toString()
                );
            });
        }

        res.json({ users, count: users.length });
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});

router.post("/not_interested", auth, async (req, res) => {
    try {
        req.user.not_interested_users = req.user.not_interested_users.concat({
            _id: req.body._id
        });

        await req.user.save();

        res.json(req.user);
    } catch (e) {
        res.status(500).send({ message: e.message });
    }
});

router.get("/all_users", auth, async (req, res) => {
    try {
        const users = await User.find({});
        res.json({ users, count: users.length });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
