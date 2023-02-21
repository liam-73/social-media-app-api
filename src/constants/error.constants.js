const USER_ERRORS = {
  USER_NOT_FOUND: { code: 404, message: 'User not found' },
  USER_ALREADY_EXISTS: { code: 409, message: 'User already exists' },
  NOT_AUTHENTICATED: { code: 401, message: 'You are not authenticated' },
  WRONG_PASSWORD: { code: 400, message: 'Wrong Password' },
};

const POST_ERRORS = {
  POST_NOT_FOUND: { code: 404, message: 'Post not found' },
  NOT_OWNER: { code: 401, message: 'You are not owner of this post' },
};

const GROUP_ERRORS = {
  GROUP_NOT_FOUND: { code: 404, message: 'Group not found' },
  NOT_ADMIN: { code: 401, message: 'You are not admin of this group.' },
};

const NOTIFICATION_ERRORS = {
  NOTI_NOT_FOUND: { code: 404, messae: 'Notification not found' },
};

module.exports = {
  USER_ERRORS,
  POST_ERRORS,
  GROUP_ERRORS,
  NOTIFICATION_ERRORS,
};
