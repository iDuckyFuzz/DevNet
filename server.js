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
const { title } = require('process');

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
        const users = await User.find();
        if (req.user.admin) {
            res.render("index", {
                users: users,
                loggedIn: true,
                admin: req.user.admin
            });
        } else {
            res.render("index", {
                loggedIn: true,
                admin: req.user.admin
            });
        }
    } else {
        res.render("index");
    }
});

app.get('/logout', auth.logout, (req, res) => {
    res.render("login", {
        error: "You have logged out!",
        loggedIn: false,
    });
})

app.get('/admin', auth.isLoggedIn, async (req, res) => {
    const users = await User.find();
    if (req.user.admin) {
        res.render("admin", {
            loggedIn: true,
            admin: req.user.admin,
            users: users
        })
    }

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
                allBlocks: allBlocks,
                loggedIn: true,
                admin: req.user.admin
            });
        } else {
            //probably went to redirect them to register?
            res.render("register", {
                message: "You must be register to view your profile"
            });
        }
    } catch (err) {
        res.send("Unable to display profile");
    }
});

app.post('/admin/update', auth.isLoggedIn, async (req, res) => {
    const user = await User.findOne({ _id: req.body.id });
    console.log(user.name);

    res.render("update", {
        id: req.body.id,
        name: user.name,
        email: user.email,
        loggedIn: true,
        admin: req.user.admin
    });
});

app.get('/update', auth.isLoggedIn, async (req, res) => {
    const user = req.user

    res.render("update", {
        id: req.body._id,
        name: user.name,
        email: user.email,
        loggedIn: true,
        admin: req.user.admin
    });
});

app.post('/update', auth.isLoggedIn, async (req, res) => {
    await User.findByIdAndUpdate(req.body.id, {
        name: req.body.name,
        email: req.body.email
    })
    res.render("profile", {
        name: req.body.name,
        email: req.body.email,
        message: "Profile updated!",
        loggedIn: true,
        admin: req.user.admin
    });

});


app.post('/delete', auth.isLoggedIn, async (req, res) => {
    if (req.body.id) {
        await User.findByIdAndDelete(req.body.id)
        await Block.deleteMany({ user: req.body.id });
        await Comment.deleteMany({ user: req.body.id });
        res.render("register", {
            message: "Admin deleted User!"
        });
    } else {
        //could use a try catch if the user doesn't exist
        await User.findByIdAndDelete(req.user._id)
        await Block.deleteMany({ user: req.user._id });
        await Comment.deleteMany({ user: req.user._id });
        res.render("register", {
            message: "Sorry to see you go! Remember you can register again anytime!"
        });
    }
});


app.get('/blockpost', auth.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render("blockPost", {
            id: req.user._id,
            loggedIn: true,
            admin: req.user.admin
        });
    } else {
        res.render("login", {
            message: "You must be logged in to create a block post"
        });
    }
});

app.get('/allBlocks', auth.isLoggedIn, async (req, res) => {
    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true
        }
    }

    const allBlocks = await Block.find().populate('user', 'name');
    const allComments = await Comment.find().populate('user', 'name');
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments,
        loggedIn: authenticated,
        admin: admin
    });
});


app.post('/blockpost', auth.isLoggedIn, async (req, res) => {
    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true
        }
    }

    await Block.create({
        user: req.user._id,
        title: req.body.title,
        body: req.body.body,
    })

    const allBlocks = await Block.find().populate('user', 'name');
    const allComments = await Comment.find().populate('user', 'name');
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments,
        loggedIn: authenticated,
        admin: admin
    });
});



app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    //add bycrypt compare of provided user & password
    try {
        let admin = false;
        const user = await User.findOne({ name: req.body.userName })
        const isMatch = await bcrypt.compare(req.body.pword, user.password)
        if (user.admin) {
            admin = true;
        }
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
                message: "Succesfully Logged in!",
                loggedIn: true,
                admin: admin
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

//to do figure out how to get the user/block id from the comemnt 
app.post('/addcomment', auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true;
        }
    }
    await Comment.create({
        user: req.user.id,
        block: req.body.blockId,
        comment: req.body.comment,
        loggedIn: authenticated
    })

    const allBlocks = await Block.find().populate('user', 'name');
    const allComments = await Comment.find().populate('user', 'name');
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments,
        loggedIn: authenticated,
        admin: admin,
    });
})

app.post('/deletecomment', auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true;
        }
    }
    await Comment.findByIdAndDelete(req.body.commentid)

    const allBlocks = await Block.find().populate('user', 'name');
    const allComments = await Comment.find().populate('user', 'name');
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments,
        loggedIn: authenticated,
        admin: admin,
    });
})

app.post('/deleteblock', auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true;
        }
    }
    await Block.findByIdAndDelete(req.body.blockId)

    const allBlocks = await Block.find().populate('user', 'name');
    const allComments = await Comment.find().populate('user', 'name');
    res.render("allBlocks", {
        allBlocks: allBlocks,
        allComments: allComments,
        loggedIn: authenticated,
        admin: admin,
    });
})

app.post('/editblock', auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true;
        }
    }

    const allBlocks = await Block.findById(req.body.blockId)
    console.log(allBlocks);

    res.render("updateBlock", {
        allBlocks:allBlocks,
        loggedIn: true,
        admin: admin
    });
})

app.post("/updateblock", auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    let admin = false;
    if (req.user) {
        authenticated = true;
        if (req.user.admin) {
            admin = true;
        }
    }
    await Block.findByIdAndUpdate(req.body.id, {
        title:req.body.title,
        body:req.body.body
    })
    
    const block = await Block.findById(req.body.id)
    res.render("updateblock", {
        allBlocks:block,
        loggedIn: true,
        admin: admin
    });
})

app.post('/updatepassword', auth.isLoggedIn, async (req, res) => {

    let authenticated = false;
    if (req.user) {
        authenticated = true;
    }
    const user = await User.findOne({ _id: req.user.id })
    if (req.body.pword === req.body.pwordConfirm) {
        const isMatch = await bcrypt.compare(req.body.currentPword, user.password)
        if (isMatch) {
            let hashedPassword = await bcrypt.hash(req.body.pword, 8);
            console.log(hashedPassword);
            await User.findByIdAndUpdate(req.user.id, {
                password: hashedPassword
            })
            res.render("profile", {
                message: "Password Updated",
                name: user.name,
                email: user.email,
                loggedIn: authenticated
            });
        } else {
            res.render("profile", {
                message: "Current password is incorrect",
                loggedIn: authenticated
            });
        }
    } else {
        res.render("profile", {
            message: "Passwords do not match!",
            loggedIn: authenticated
        });
    }
});

app.post('/register', async (req, res) => {

    if (req.body.pword != req.body.pwordConfirm) {
        res.render("register", {
            message: "Passwords do not match!"
        });
    } else {
        //hash the password
        const reg = await User.findOne({ email: req.body.userEmail });
        if (reg) {
            res.render("register", {
                message: "Email address already registered!"
            });
        } else {
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
    }
});

app.get('*', (req, res) => {
    res.render("pageNotFound");
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});