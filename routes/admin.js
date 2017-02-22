//only admin can add category
var router = require('express').Router();
var async = require('async');
var faker = require('faker');
var Catergory = require('../models/category');
var Product = require('../models/product');

var Category = require('../models/category');

router.get('/add-category',function (req, res, next) {
    res.render('admin/add-category',{message:req.flash('success')});
});

router.post('/add-category',function (req,res,next) {

    var category = new Category();

    category.name = req.body.name;

    category.save(function (err) {
        if(err) return next(err);
        //todo
        req.flash('success','Successfully added a category');
        return res.redirect('/add-category');
    });

});

router.get('/add-products',function (req, res, next) {
    res.render('admin/add-products',{message:req.flash('success')});
});

//use faker api to put data into the category in database
//search the category name
router.post('/add-products',function (req,res,next) {

    async.waterfall([

        //add a new category to mongo Lab
        function (callback) {
            Catergory.findOne({name: req.body.productsName},function (err,category) {
                console.log(req.body.productsName);
                console.log(category);
                if(err) return next(err);
                // res.json({message:'no such category found'});
                callback(null,category);
            });
        },

        //using fakerjs to inject data to each product
        function (category,callback) {
        console.log(category);
        console.log(callback);
            if (category !== null){
                for(var i=0; i<30;i++){
                    var product = new Product();
                    //assign category id to product.category
                    //product has a category kind as its upper division
                    product.category = category._id;
                    product.name = faker.commerce.productName();
                    product.price = faker.commerce.price();
                    product.image = faker.image.image();
                    product.save();
                }
                res.json({message:'success'});
            }
        }
    ]);

});

module.exports = router;