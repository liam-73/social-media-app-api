const R = require('ramda');
const bcrypt = require('bcrypt');

const generateToken = require('../middlewares/generateToken');
const UserModel = require('../models/user.model');
const NotificationService = require('./notification.service');
const { USER_ERRORS } = require('../constants/error.constants');

module.exports = () => ({
  createUser: async (userData) => {
    const userExisted = await UserModel.findOne({ email: userData.email });

    if (userExisted) throw new Error(USER_ERRORS.USER_ALREADY_EXISTS);

    const user = await UserModel.create(userData);

    const token = await generateToken.authToken(user);

    return { user, token };
  },

  login: async (email, password) => {
    const user = await UserModel.findOne({ email });

    if (!user) throw USER_ERRORS.USER_NOT_FOUND;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw USER_ERRORS.WRONG_PASSWORD;

    const token = await generateToken.authToken(user);

    return { user, token };
  },

  updateUser: async (userData, data) => {
    const user = await UserModel.findById(userData._id);

    if (!user) throw USER_ERRORS.USER_NOT_FOUND;

    return await UserModel.findByIdAndUpdate(id, data, { new: true });
  },

  getUserById: async (user_id) => {
    const user = await UserModel.findById(user_id);

    if (!user) throw USER_ERRORS.USER_NOT_FOUND;

    return user;
  },

  sentFriendRequest: async (user, friend_id) => {
    const user = await UserModel.findById(friend_id);

    if (!user) throw USER_ERRORS.USER_NOT_FOUND;

    if (user.friend_requests) {
      user.friend_requests = user.friend_requests.push({
        user: user._id,
      });
    } else {
      user.friend_requests = [{ user: user._id }];
    }

    const notification = user.name + ' sent  you a friend request.';

    NotificationService.sentNotification(friend_id, notification);

    await user.save();
  },

  getFriendRequests: async (userData) => {
    const { friend_requests } = await UserModel.findById(userData._id)
      .sort({
        'friend_requests.createdAt': -1,
      })
      .populate('friend_requests.user');

    return { friend_requests, count: friend_requests.length };
  },

  handleFriendRequests: async (user, friend_id, is_remove) => {
    const friend = await UserModel.findById(friend_id);

    if (!friend) throw USER_ERRORS.USER_NOT_FOUND;

    if (is_remove) {
      user.friend_requests = await user.friend_requests.remove({
        user: friend_id,
      });
    } else {
      user.friends = user.friends.concat({ user: friend_id });
      friend.friends = friend.friends.concat({ user: user._id });

      await friend.save();

      const notification = user.name + ' accepted your friend request.';
      NotificationService.sentNotification(friend_id, notification);
    }

    await user.save();
  },

  getFriends: async (user, payload) => {
    const { search } = payload;

    const user = await user.populate('friends.user');

    if (search) {
      user.friends = user.friends.filter(
        (friend) => friend.name == new RegExp(search, 'i'),
      );
    } else {
      user.friends.sort((a, b) =>
        a._id.name.toLowerCase() > b._id.name.toLowerCase()
          ? 1
          : a._id.name.toLowerCase() < b._id.name.toLowerCase()
          ? -1
          : 0,
      );
    }

    return { friends: user.friends, count: user.friends.length };
  },

  getMutualFriends: async (user, friend_id) => {
    await user.populate('friends.user');

    const friend = await UserModel.findById(friend_id);

    if (!friend) throw USER_ERRORS.USER_NOT_FOUND;

    await friend.populate('friends.user');

    const mutual_friends = R.intersection(user.friends, friend.friends);

    return { mutual_friends, count: mutual_friends.length };
  },

  updateFriends: async (user, friend_id, type) => {
    const friend = await UserModel.findById(friend);

    if (!friend) throw USER_ERRORS.USER_NOT_FOUND;

    if (type == 'UNFRIEND') {
      await friend.friends.remove({ user: user._id });

      await user.friends.remove({ user: friend_id });
    } else if (type == 'BLOCK') {
      await friend.friends.remove({ user: user._id });

      await user.friends.remove({ user: user._id });
      user.blocked_users = user.blocked_users.concat({ user: friend_id });
    } else {
      await user.blocked_users.remove({ user: friend_id });
    }

    await user.save();
    await friend.save();
  },

  getBlockedUsers: async (userData) => {
    const user = await userData.populate('blocked_users.user');

    user.blocked_users.sort((a, b) =>
      a.user.name > b.user.name ? 1 : a.user.name < b.user.name ? -1 : 0,
    );

    return user.blocked_users;
  },

  getUsers: async (payload) => {
    const { search } = payload;

    let filter = {};

    if (search) {
      filter.name = { regex: search };
    }
    const [users, count] = Promise.all(
      await UserModel.find(filter),
      await UserModel.countDocuments(),
    );

    return { users, count };
  },
});
