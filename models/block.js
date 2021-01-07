const mongoose = require('mongoose');

//tables in mongodb are called collections
const blog = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref:'user',
    },
    title: {
        type: String,
        require: true
    },
    body: {
        type: String,
        require: true
    },
},{
    // you can do this or create a date in the main object using date: new Date()
    timestamps:true
})

module.exports = mongoose.model('blog', blog);