var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//mongoosastic is a mongoose plugin that can automatically index your models into elasticSearch
//to start elasticSearch, type in 'brew services start elasticSearch' on command line
//to delete elasticSearch search index, type in 'curl -XDELETE 'http://localhost:9200/_all''
var mongoosastic = require('mongoosastic');

var ProductSchema = new Schema({
    category:{type: Schema.Types.ObjectId, ref:'Category'},
    name: String,
    price: Number,
    image:String
});

//plugin elastic search
ProductSchema.plugin(mongoosastic,{
    hosts:[
        //this is the default port for elastic search
        'localhost:9200'
    ]
});

module.exports = mongoose.model('Product',ProductSchema);