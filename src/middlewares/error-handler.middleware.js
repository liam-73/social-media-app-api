module.exports = (error, req, res, next) => {
  const { code = 500, message = 'Server Error' } = error;

  res.status(code).json({ code, message });
};
