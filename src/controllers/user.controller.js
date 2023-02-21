const UserServices = require('../services/user.service');
const GroupService = require('../services/group.service');

module.exports = () => ({
  createUser: async (data) => await UserServices.createUser(data),

  login: async (email, password) => await UserServices.login(email, password),

  updateUser: async (user, body) => await UserServices.updateUser(user, body),

  getUserById: async (user_id) => await UserServices.getUserById(user_id),

  sentFriendRequest: async (user, friend_id) =>
    await UserServices.sentFriendRequest(user, friend_id),

  getFriendRequests: async (user) => await UserServices.getFriendRequests(user),

  handleFriendRequests: async (user, friend_id) =>
    await UserServices.handleFriendRequests(user, friend_id),

  getFriends: async (user, payload) =>
    await UserServices.getFriends(user, payload),

  getMutualFriends: async (user, friend_id) =>
    await UserServices.getMutualFriends(user, friend_id),

  updateFriends: async (user, friend_id, type) =>
    await UserServices.updateFriends(user, friend_id, type),

  getBlockedUsers: async (user) => await UserServices.getBlockedUsers(user),

  getUsers: async () => await UserServices.getUsers(),

  getUserGroups: async (user, are_own_groups) => {
    if (!are_own_groups) return await GroupService.getJoinedGroups(user._id);

    return await GroupService.getOwnGroups(user._id);
  },

  requestToJoinGroup: async (user, group_id) =>
    await GroupService.requestToJoinGroup(user._id, group_id),
});
