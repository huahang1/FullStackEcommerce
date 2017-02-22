var express = require('express');
//morgan records each request, can log requests to a file
var fs = require('fs');
var morgan = require('morgan');
//mongoose is an Object Document Mapper
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
//Express 4.x layout and partial template functions for EJS template engine
var engine= require('ejs-mate');
var session = require('express-session');
var cookieParser = require('cookie-parser');
//express-flash is used to store alert information about operation like 'login fail'
var flash = require('express-flash');
//MongoStore is used to store session into database
var MongoStore = require('connect-mongo/es5')(session);
//authenticate tool
var passport = require('passport');

//use the config file to separate important information from database and server
var secret = require('./config/secret');
var Category = require('./models/category');
var cartLength = require('./middleware/middlewares');

//add this to avoid warning: Mongoose: mpromise (mongoose's default promise library) is deprecated, plug in your own promise library instead
mongoose.Promise = global.Promise;
//connect to mongoLab
mongoose.connect(secret.database,function (err) {
    if(err){
        console.log(err);
    }else{
        console.log('connected to the data base');
    }
});

var app = express();

//write log to 'access.log' under the same directory
var accessLogStream = fs.createWriteStream(__dirname + '/access.log',{flags:'a'});

//Middleware
//add this line to let express use the static file like css file
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(morgan('combined',{stream: accessLogStream}));
app.use(bodyParser.json());
//extended: true means parsing URL-encoded data with qs library(can parse json-like data), default value is true; false means using querystring library
app.use(bodyParser.urlencoded({extended:true}));
//ejs-mate as web render engine
app.engine('ejs',engine);
app.set('view engine','ejs');
app.use(cookieParser());
app.use(session({
//force the session to be saved back to session store, since it doesn't implements touch function(automatically delete the session) and set the expiration date, set it to true
resave: true,
    //allow a new session but not modified to be saved to mongoLab, true is the default value
    saveUninitialized: true,
    //secretKey has already been defined in config/secret.js file
    secret:secret.secretKey,
    //save session into mongoLab
    store: new MongoStore({url:secret.database,autoReconnect:true})
}));
//use flash middle to storage alert information
app.use(flash());
//remember to initialize passport otherwise passport cannot work
app.use(passport.initialize());
//passport will maintain persistent login sessions(the authenticated user must be serialized to the session and deserialized when request )
app.use(passport.session());

//let each page has the user object so we don't need to render user each time
app.use(function (req,res,next) {
    res.locals.user = req.user;
    next();
});

//let each page has all the categories information
app.use(function (req,res,next) {
    //find all categories
    Category.find({},function (err,categories) {
        if(err) return next(err);
        res.locals.categories = categories;
        next();
    });
});

//show the cart Length on each page to remind user how many items are unchecked in cart
app.use(cartLength);

//add these routes, it works once receive url request
var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var apiRoutes = require('./api/api');

app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use('/api',apiRoutes);

//server listens to port number 3000
app.listen(secret.port,function (err) {
    if(err) throw err;
    console.log("Server is Running on port " + secret.port);
});