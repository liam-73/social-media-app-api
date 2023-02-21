const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { USER_ERRORS } = require('../constants/error.constants');

const authenticate = async (req, res, next) => {
  if (!req.headers.authorization) next(USER_ERRORS.NOT_AUTHENTICATED);

  const [tokenType, token] = req.headers.authorization.split(' ');

  if (tokenType !== 'Bearer' && !token)
    return next(USER_ERRORS.NOT_AUTHENTICATED);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  try {
    const user = await User.findOne({ _id: decoded._id });

    if (!user) next(USER_ERRORS.NOT_AUTHENTICATED);

    req.token = token;
    req.user = user;
  } catch (e) {
    return next(USER_ERRORS.NOT_AUTHENTICATED);
  }

  return next();
};

module.exports = authenticate;
