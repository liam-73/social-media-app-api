const GroupModel = require('../models/group.model');
const { GROUP_ERRORS } = require('../constants/error.constants');

module.exports = () => ({
  createGroup: async (user, payload) =>
    await GroupModel.create({
      admin: user._id,
      ...payload,
    }),

  getGroups: async (payload) => {
    const { search } = payload;
    const filter = {};

    if (search) filter.name = { regex: search };

    const [groups, count] = Promise.all(
      await GroupModel.find(filter),
      await GroupModel.countDocuments(filter),
    );

    return { groups, count };
  },

  getGroupById: async (id) => {
    const group = await GroupModel.findById(id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    return group;
  },

  updateGroup: async (user, group_id, payload) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    if (group.admin != user._id) throw GROUP_ERRORS.NOT_ADMIN;

    return await GroupModel.findByIdAndUpdate(group_id, payload);
  },

  acceptGroupMember: async (user, group_id, member) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    if (group.admin != user._id) throw GROUP_ERRORS.NOT_ADMIN;

    group.members = await group.members.concat({
      user: member,
    });
  },

  removeGroupMember: async (user, group_id, member) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    if (group.admin != user._id) throw GROUP_ERRORS.NOT_ADMIN;

    group.members = await group.members.remove({
      user: member,
    });
  },

  rejectedGroupMemberRequest: async (user, group_id, member) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    if (group.admin != user._id) throw GROUP_ERRORS.NOT_ADMIN;

    group.requested_members = await group.requested_members.remove({
      user: member,
    });
  },

  deleteGroup: async (group_id) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    if (group.admin != user._id) throw GROUP_ERRORS.NOT_ADMIN;

    return await group.remove();
  },

  getJoinedGroups: async (user_id) => {
    const [groups, count] = Promise.all(
      await GroupModel.find({ 'members.user': user_id }),
      await GroupModel.countDocuments({ 'members.user': user_id }),
    );

    return { groups, count };
  },

  getOwnGroups: async (user_id) => {
    const [groups, count] = Promise.all(
      await GroupModel.find({ admin: user_id }),
      await GroupModel.countDocuments({ admin: user_id }),
    );

    return { groups, count };
  },

  requestToJoinGroup: async (user_id, group_id) => {
    const group = await GroupModel.findById(group_id);

    if (!group) throw GROUP_ERRORS.GROUP_NOT_FOUND;

    group.requested_members = await group.requested_members.concat({
      user: user_id,
    });

    await group.save();
  },
});
