const mongoose = require('mongoose');

//tables in mongodb are called collections
const user = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    admin: {
        type: Boolean,
        default: false
    },
})

module.exports = mongoose.model('user', user);