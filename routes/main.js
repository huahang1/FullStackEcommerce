var router  = require('express').Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
var async = require('async');
var User = require('../models/user');

//stripe payment, this key is used as test secret key
var stripe = require('stripe')('sk_test_CG07eJcwS1TyZuvgOxdDGL14');

function paginate(req,res,next) {

    var perPage = 9;
    var page = req.params.page;

    //use mongoose method to achieve pagination
    Product
        .find()
        .skip(perPage * page)
        .limit(perPage)
        .populate('category')
        .exec(function (err,products) {
            if(err) return next(err);
            Product.count().exec(function (err,count) {
                if(err) return next(err);
                res.render('main/product-main',{
                    products:products,
                    page:page,
                    pages:count / perPage
                });
            });
        });
}

//Product is mongoose model and createmapping is a one-time operation
//map between mongoosastic and elasticsearch
Product.createMapping(function (err,mapping) {
    if(err){
        console.log("error creating mapping");
        console.log(err);
    }else{
        console.log("Mapping created");
        console.log(mapping);
    }
});

//call the synchronize method on model to open a mongoose stream and start indexing documents individually
var stream = Product.synchronize();

var count = 0;

//this stream connects database and elastic search
stream.on('data',function () {
    count++;
});

stream.on('close',function () {
    console.log("Indexed " + count + ' documents');
});

stream.on('error',function (err) {
    console.log(err);
});

router.get('/cart',function (req,res,next) {

    //exec gets all the cart information from specific user and pass information to parameter called foundCart
    //render data: pass data from the back-end to front-end
    Cart
        .findOne({owner : req.user._id})
        .populate('items.item')
        .exec(function (err,foundCart) {
            if (err) return next(err);
            res.render('main/cart',{
                foundCart: foundCart,
                message:req.flash('remove')
            });
        });
});

//req.body refers to the key-value pairs of data submitted by forms
//add product to cart and calculate total price
router.post('/product/:product_id',function (req,res,next) {
    Cart.findOne({ owner: req.user._id },function (err,cart) {
        cart.items.push({
            item: req.body.product_id,
            price: parseFloat(req.body.priceValue),
            quantity: parseInt(req.body.quantity)
        });

        //limit the decimal to 2 digits
        cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

        //save cart to mongo Lab
        cart.save(function (err) {
            if (err) return next(err);
            return res.redirect('/cart');
        });
    });
});

//remove the product information in cart
router.post('/remove',function (req,res,next) {

    //make sure the cart is the one which user is using
    Cart.findOne({owner: req.user._id},function (err,foundCart) {

        foundCart.items.pull(String(req.body.item));
        foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
        foundCart.save(function (err,found) {
            if (err) return next(err);

            //add message to 'remove'
            req.flash('remove','Successfully remove');
            res.redirect('/cart');
        });
    });
});

router.post('/search',function (req,res,next) {
    res.redirect('/search?q=' + req.body.q);
});

//req.query.q will search for the string param in get Url after keyword 'q'
router.get('/search',function (req,res,next) {
    if(req.query.q){
        Product
            .search({
            query_string:{ query: req.query.q}
        },function (err,results) {
            results:
            if(err) return next(err);

            //elasticsearch method
            var data = results.hits.hits;

            console.log(data);

            res.render('main/search-result',{
                query:req.query.q,
                data:data
            });
        });
    }
});

router.get('/page/:page',function (req,res,next) {
    paginate(req,res,next);
});

router.get('/',function (req,res,next) {
    //if the user has already logged in , show the paginate product information
    if(req.user){
        paginate(req,res,next);
    }else{
        res.render('main/home');
    }
});

//req.params refers to the params after : in get url
//get all products information in specific category
router.get('/products/:id',function (req,res,next) {
    Product
        .find({category: req.params.id})
        //populate means get all the data in its parameter
        .populate('category')
        .exec(function (err,products) {
            if(err) return next(err);
            res.render('main/category',{
                products:products
            });
        });
});

router.get('/product/:id',function (req,res,next) {
    Product.findById({_id:req.params.id},function (err,product) {
        if(err) return next(err);
        res.render('main/product',{
            product:product
        });
    });
});


router.post('/payment',function (req,res,next) {

    //stripeToken is added by customjs by appending html element
    var stripeToken = req.body.stripeToken;
    var currentCharges = Math.round(req.body.stripeMoney * 100);
    stripe.customers.create({
        source:stripeToken,
    }).then(function (customer) {
        return stripe.charges.create({
            amount:currentCharges,
            currency:'usd',
            customer: customer.id
        });
    }).then(function (charge) {

        async.waterfall([

            //add buy history to profile
            function (callback) {
                Cart.findOne({owner:req.user._id},function (err,cart) {
                    callback(err, cart);
                });
            },

            function (cart,callback) {
                User.findOne({_id: req.user._id},function (err,user) {
                    if (user){
                        for (var i = 0 ; i < cart.items.length; i++){
                            user.history.push({
                                item:cart.items[i].item,
                                paid:cart.items[i].price
                            });
                        }
                        user.save(function (err,user) {
                            if (err) return next(err);
                            callback(err, user);
                        });
                    }
                });
            },

            //after checking out, empty the cart
            function (user) {
                Cart.update({owner: user._id},{ $set :{items: [],total: 0}},function (err,updated) {
                    if (updated){
                        res.redirect('/profile');
                    }
                });
            }
        ]);
    });
});

module.exports = router;