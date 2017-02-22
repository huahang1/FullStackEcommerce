/**
 * Created by hanghua on 11/23/16.
 */
module.exports={

    //database information
    database:'mongodb://Chris:123@ds161497.mlab.com:61497/ecommerce',
    port:3000,
    secretKey:"Chris@#$%",

    //facebook plugin
    facebook:{
        clientID: process.env.FACKBOOK_ID || '331147030598972',
        clientSecret: process.env.FACEBOOK_SECRET || 'ab6c6d583c894a2861d104244e64cf1a',
        //show email and name on profile page
        profileFields: ['emails','displayName'],
        callbackURL:'http://localhost:3000/auth/facebook/callback'
    }
}