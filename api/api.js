var router = require('express').Router();
var Product = require('../models/product');

//Ajax request for searching
//according to the url information, return the search results
router.post('/search',function (req,res,next) {
    console.log(req.body.search_term);
    //elastic search built-in method
    Product.search({
        query_string:{query: req.body.search_term}
    },function (err,results) {
        if(err) return next(err);
        res.json(results);
    });
});

module.exports = router;