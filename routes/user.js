var router = require('express').Router();
var User = require('../models/user');
var Cart = require('../models/cart');
var async = require('async');
var passport = require('passport');
var passportConf = require('../config/passport');

router.get('/login',function (req,res) {
    if(req.user) return res.redirect('/');
    res.render('accounts/login',{message:req.flash('loginMessage')});
});

router.post('/login',passport.authenticate('local-login',{
    successRedirect:'/profile',
    failureRedirect:'/login',
    //add the failureFlash message defined by the strategy's verify callback
    failureFlash: true,
}));

router.get('/profile',passportConf.isAuthenticated,function (req,res,next) {
    User
        .findOne({_id: req.user._id})
        .populate('history.item')
        .exec(function (err,foundUser) {
            if (err) return next(err);
            res.render('accounts/profile',{user: foundUser});
        });
});

router.get('/signup',function (req,res,next) {
    res.render('accounts/signup',{
        //render 'errors' data otherwise 'errors' will be undefined
        errors: req.flash('errors')
    });
});

router.post('/signup',function (req,res,next) {

    //async.waterfall can pass its results on to the next function, it works like data pipeline
    async.waterfall([
        function (callback) {

            var user = new User();

            //get the username,email and password from the front-end type in
            user.profile.name = req.body.name;
            user.email = req.body.email;
            user.password = req.body.password;

            //generate a unique image according to email address when sign up
            user.profile.picture = user.gravatar();

            User.findOne({email: req.body.email},function (err,existingUser) {
                if(existingUser){
                    //add error message to flash
                    req.flash('errors', 'Account with that email address already exists');
                    return res.redirect('/signup');
                }else{
                    user.save(function (err,user) {
                        if(err) return next(err);
                        callback(null, user);
                    });
                }
            });
        },

        //create a cart when user successfully sign up
        function (user) {
            var cart = new Cart();
            //mark the cart with user id as its owner
            cart.owner = user._id;
            cart.save(function (err) {
                if (err) return next(err);
                //judge if user log in
                req.logIn(user, function (err) {
                    if (err) return next(err);
                    res.redirect('/profile');
                });
            });
        }
    ]);
});

router.get('/logout',function (req,res) {
    req.logout();
    res.redirect('/');
});

router.get('/edit-profile',function (req,res,next) {
    res.render('accounts/edit-profile',{message: req.flash('success')});
});

router.post('/edit-profile',function (req,res,next) {
    //make sure the user id is consistent with the current user
    User.findOne({ _id: req.user._id },function (err,user) {

        if(err) return next(err);

        if(req.body.name) user.profile.name = req.body.name;

        if(req.body.address) user.address = req.body.address;

        user.save(function (err) {
            if(err) return next(err);
            req.flash('success','Successfully Edited your profile!');
            return res.redirect('/profile');
        });
    });
});

router.get('/auth/facebook',passport.authenticate('facebook',{scope:'email'}));

router.get('/auth/facebook/callback',passport.authenticate('facebook',{
    successRedirect:'/profile',
    failureRedirect:'/login'
}));

module.exports=router;
