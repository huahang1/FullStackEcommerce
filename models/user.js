/**
 * Created by hanghua on 11/21/16.
 */
//mongoose is ODM(object data modeling), like Hibernate is Object Relationship Mapping
var mongoose = require('mongoose');
//bcrypt is used to hash password before saving to database
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var Schema = mongoose.Schema;

/* the user schema attributes / characteristics /fields */
var UserSchema = new Schema({

    //unique means this email can only be saved once in the database
    email:{type:String,unique:true,lowercase:true},

    password:String,

    facebook:String,
    //tokens for facebook
    tokens:Array,

    profile:{
        name:{type:String,default: ''},
        picture:{type:String, default: ''}
    },

    address:String,

    //show buy history on profile
    history:[{
        paid:{type:Number,default:0},
        item:{type: Schema.Types.ObjectId,ref:'Product'}
    }]

});

//Hash the password before saving to database

//pre to hash password before save it to database
UserSchema.pre('save',function (next) {
    var user = this;

    //if the user doesn't modify password, just return this password and go to the callback
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10,function (err,salt) {
        //if any error, return it and go to the callback
        if(err) return next(err);
        //null means no error, you can also pass in err but it's not necessary
        bcrypt.hash(user.password,salt,null,function (err,hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

/* compare the password in database and the one that user types in */

//this method name is user-defined
UserSchema.methods.comparePassword = function (password) {
    //bcrypt has a built-in method to compare password
    /* why I use compareSync instead of compare? Because compare method brings a callback
    function with the result for next step usage in this function, but right now I only need the return value
    so it's unnecessary to use compare method */
    return bcrypt.compareSync(password,this.password);
}

//generate a picture to new user
UserSchema.methods.gravatar = function (size) {
    //set the image size
    if(!this.size) size = 200;
    //generate a random picture
    if(!this.email) return 'https://gravatar.com/avatar/?s' + size + '&d=retro';
    //generate a unique image according to the email address
    //digest the 'hex' to set encoding
    var md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
}

module.exports = mongoose.model('User',UserSchema);