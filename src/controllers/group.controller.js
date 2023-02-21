const groupService = require('../services/group.service');

module.exports = () => ({
  createGroup: async (user, payload) =>
    await GroupService.createGroup(user, payload),

  getGroups: async (payload) => await GroupService.getGroups(payload),

  getGroupById: async (id) => await GroupService.getGroupById(id),

  updateGroup: async (user, group_id, payload) => {
    const { accepted_member, removed_member, rejected_member_request } =
      payload;

    if (accepted_member)
      return await GroupService.acceptGroupMember(
        user,
        group_id,
        accepted_member,
      );

    if (removed_member)
      return await GroupService.removeGroupMember(
        user,
        group_id,
        removed_member,
      );

    if (rejected_member_request)
      return await GroupService.rejectGroupMemberRequest(
        user,
        group_id,
        rejected_member_request,
      );

    return await GroupService.updateGroup(user, group_id, payload);
  },

  deleteGroup: async (group_id) => await GroupService.deleteGroup(group_id),
});
