const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 5000;
const path = require('path');
const hbs = require('hbs');
require('dotenv').config();
const User = require('./models/user');
const Block = require('./models/block');
const Comment = require('./models/comment');
const auth = require('./middlewares/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

//connect to mongodb database
mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB is connected!"))

//get the folder directory
const viewsPath = path.join(__dirname, '/views');
const publicDirectory = path.join(__dirname, '/public');

// set the path for the inc files (partials)
const partialPath = path.join(__dirname, '/views/inc');
hbs.registerPartials(partialPath);

//set express to use the static files
app.use(express.static(publicDirectory));

//set the view engine to hbs
app.set('view engine', 'hbs');

//setting the views from hbs to come from our views path variable
app.set('views', viewsPath);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ extended: false }));
app.use(cookieParser());

//setting the views from hbs to come from our views path variable
app.set('views', viewsPath);
//set the view engine to hbs
app.set('view engine', 'hbs');
//set express to use the static files
app.use(express.static(publicDirectory));

app.get('/', auth.isLoggedIn, async (req, res) => {
    if (req.user) {
        console.log("User found");
        const users = await User.find();
        if (req.user.admin) {
            const users = await User.find();
            console.log("You are an admin");
            res.render("index", {
                users: users
            });
        } else {
            res.render("index");
        }
    } else {
        console.log("You are a guest");
        res.render("index");
    }
});

app.get('/logout', auth.logout, (req, res) => {
    res.render("login", {
        error: "You have logged out!"
    });
})

app.get('/register', (req, res) => {
    res.render("register");
});

//we can add a middleware function to handle authenication
// 
app.get('/profile', auth.isLoggedIn, async (req, res) => {

    try {
        //you will only be able to view the users profile
        if (req.user) {
            console.log(req.user.name);
            //could use a try catch here 
            //const user = await User.findById(req.params.id);

            const user = req.user


            // we can get extra details using populate
            //const name = await Block.find({ user: user._id }).populate('user', 'name email password');
            const allBlocks = await Block.find({ user: user._id });
            res.render("profile", {
                id: user._id,
                name: user.name,
                email: user.email,
                allBlocks: allBlocks
            });
        } else {
            //probably went to redirect them to register?
            res.render("profile");
        }
    } catch (err) {
        res.send("Unable to display profile");
    }
});

app.get('/profile/update', auth.isLoggedIn, async (req, res) => {

    //could use a try catch if the user doesn't exist

    // const userName = req.user.name
    // const userEmail = "Jill@gmail.com";

    // await User.findByIdAndUpdate(req.params.id, {
    //     name: userName,
    //     email: userEmail
    // })

    res.send(`${req.user.name}: Update Succesful!`);
});


app.post('/delete/', auth.isLoggedIn, async (req, res) => {
    //could use a try catch if the user doesn't exist
    await User.findByIdAndDelete(req.user._id)
    res.send("Delete Succesful!");
});


app.get('/blockpost', auth.isLoggedIn, (req, res) => {
    try {
        res.render("blockPost", {
            id: req.user._id
        });
    } catch (err) {
        res.render("login", {
            message: "You must be logged in to create a block post"
        });
    }
});

app.get('/allBlocks', auth.isLoggedIn, async (req, res) => {
    const allBlocks = await Block.find();
    const allComments = await Comment.find();
    console.log(allComments);
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments
    });
});

app.post('/blockpost', auth.isLoggedIn, async (req, res) => {
    await Block.create({
        user: req.user._id,
        title: req.body.title,
        body: req.body.body,
    })

    res.send("Post Succesful")
});



app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    //add bycrypt compare of provided user & password
    try {
        const user = await User.findOne({ name: req.body.userName })
        const isMatch = await bcrypt.compare(req.body.pword, user.password)

        if (isMatch) {
            // create a token to sign to authenticate
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN,
            });
            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                httpOnly: true
            }
            res.cookie('jwt', token, cookieOptions);
            res.render("index", {
                message: "Succesfully Logged in!"
            })
        } else {
            const error = "login failed";
            res.render("login", {
                message: error
            });
        }
    } catch (err) {
        const error = "login failed";
        res.render("login", {
            message: error
        });
    }
});

app.post('/addcomment', auth.isLoggedIn, async (req,res) => {
    await Comment.create({
        user: req.user._id,
        comment: req.body.comment
    })

    const allBlocks = await Block.find();
    const allComments = await Comment.find();
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments
    });
})

app.post('/register', async (req, res) => {

    if (req.body.pword != req.body.pwordConfirm) {
        res.render("register", {
            message: "Passwords do not match!"
        });
    } else {
        //hash the password
        let hashedPassword = await bcrypt.hash(req.body.pword, 8);
        await User.create({
            name: req.body.userName,
            email: req.body.userEmail,
            password: hashedPassword
        })

        res.render("index", {
            message: "Succesfully registered, please login."
        });
    }
});

app.get('*', (req, res) => {
    res.render("pageNotFound");
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});