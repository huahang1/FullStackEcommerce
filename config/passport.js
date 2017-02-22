var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var secret = require('../config/secret');
var User = require('../models/user');

var async = require('async');
var Cart = require('../models/cart');

//serialize and deserialize

//serialize is used to store session as an object into database
//details can be found in npmjs.com/package/passport
passport.serializeUser(function (user,done) {
    done(null,user._id);
});

//deserialize the session object to get information
passport.deserializeUser(function (id,done) {
    User.findById(id,function (err,user) {
        done(err,user);
    });
});


//the new LocalStrategy is the instance of the local-login
//add 'local-login' name to passport because I use the same name in passport.authenticate() method
passport.use('local-login',new LocalStrategy({
    usernameField:'email',
    passwordFiled:'password',
    //set the passReqToCallback to true so req can be passed into the callback then it can be used it to flash alert information
    passReqToCallback:true
},function (req,email,password,done) {

    User.findOne({email:email},function (err,user) {

        if(err) return done(err);

        //if the user doesn't exist
        if(!user){
            return done(null,false,req.flash('loginMessage','No user has been found'));
        }

        //if the user exists then compare the typed password with password in database
        if(!user.comparePassword(password)){
            return done(null,false,req.flash('loginMessage','Oops,Wrong password'));
        }

        return done(null,user);
    });
}));

//facebook plugin middleware
//refreshtoken is not used here actually, it exists just in case token changes
passport.use(new FacebookStrategy(secret.facebook,function (token,refreshToken,profile,done) {

    User.findOne({facebook: profile.id},function (err,user) {

        if (err) return done(err);

        //if user already exists (also with cart), don't create cart and profile for him
        if (user){
            return done(null, user);
        }else{
            //use async.waterfall to create a cart after user using facebook to login
            async.waterfall([
                function (callback) {
                    var newUser = new User();
                    newUser.email = profile._json.email;
                    newUser.facebook = profile.id;
                    newUser.tokens.push({kind:'facebook',token:token});
                    newUser.profile.name = profile.displayName;
                    newUser.profile.picture = 'http://graph.facebook.com/' + profile.id + '/picture?type=large';

                    newUser.save(function (err) {
                        if (err) throw err;

                        callback(err, newUser);
                    });
                },

                //give a cart to facebook user when they log in
                function (newUser) {
                    var cart = new Cart();
                    cart.owner = newUser._id;
                    cart.save(function (err) {
                        if (err) return done(err);
                        return done(err, newUser);
                    });
                }
            ])
        }
    });
}));

//custom function to validate
exports.isAuthenticated = function (req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
};