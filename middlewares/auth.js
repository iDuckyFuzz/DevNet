const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


exports.isLoggedIn = async (req, res, next) => {
    console.log("Checking if using is autheniticated");

    if (req.cookies.jwt) {
        console.log("The cookie jwt exists");
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
        console.log(decoded);

        req.user = await User.findById(decoded.id);
    }

    //done the required actions
    next();
}

exports.logout = (req, res, next) => {

    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });

    //done the required actions
    next();
}