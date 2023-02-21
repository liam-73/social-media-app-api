const jwt = require("jsonwebtoken");

const authToken = async user => {
    const token = jwt.sign(
        { _id: user._id.toString() },
        process.env.JWT_SECRET
    );
    return token;
};

module.exports = {
    authToken
};
