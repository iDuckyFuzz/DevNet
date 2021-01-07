const mongoose = require('mongoose');

//tables in mongodb are called collections
const comment = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref:'user',
    },
    block: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref:'block',
    },
    comment: {
        type: String,
        require: true
    }
},{
    // you can do this or create a date in the main object using date: new Date()
    timestamps:true
})

module.exports = mongoose.model('comment', comment);