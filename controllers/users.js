const bcrypt = require('bcrypt')
const userData = require('../models/users')
const { signup, luhnAlgo } = require('../utils/validators')
const numberGenerator = require('../utils/generator')
const passport = require('passport')
let LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done){
	done(null, user.id)
})

passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		done(err, user)
	})
})

//Local strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    userData.findOne({ username: username}, function (err, user) {
      if (err) { 
          return done(err); 
        }
      if (!user) { 
      	return done(null, false); 
      }
      userData.comparePassword(password, user.password, (err, isMatch)=>{
		if(err) throw err
		if(isMatch){
            console.log(user)
			return done(null, user)
		}else{
			return done(null, false, {message: 'Invalid Password'})
		}
	})
    });
  }
));


const rerender_register = function(req, res, errors, referralIDError) {
    res.render('user/register', {data: req.body, errors, referralIDError});
}

const email_view = function(req, res, theErrors) {
    res.render('user/register', {data: req.body, theErrors});
}

exports.get_login = function(req, res) {
    res.render('user/login');
}

exports.login = function(req, res, next) {
    passport.authenticate('local',{
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
}

exports.get_referral_register = function(req, res, next) {
    res.render('user/register', {referral_id: req.params.id});
}

exports.get_register = function(req, res, next) {
    res.render('user/register');
}

exports.register = async function(req, res, next) {
    const theUsername = req.body.username
    const thePassword = req.body.password
    const theReferral = req.body.referral
    const newPassword = await bcrypt.hash(thePassword, 10)
    const date = new Date().toTimeString().split(" ")[0];
    
    const { referralIDError, referralValid} = luhnAlgo(theReferral);
    const { errors, valid } = signup(theUsername, thePassword);
    
    userData.findOne({username: theUsername}).then(user=>{
		const theErrors = {};
        if(user !== null){
            theErrors["username_exists"] = "Username already in use"
            email_view(req, res, theErrors);
        }
        else{
            if(!valid || !referralValid){
                rerender_register(req, res, errors, referralIDError);
            }
            userData.findOne({referralID : theReferral}).then(user=>{
                    if(user){
                        const newNo = (Number(user.referralNO) + 1)
                        user.referralNO = newNo
                        user.save();
                        const newUser = new userData({
                            username: theUsername,
                            password: newPassword,
                            referralID:  numberGenerator(),
                            date: date,
                            referred: theReferral
                        })
                        newUser.save().then(result=>{
                            res.render('index', {success:"Account Creation Successful"})
                        })
                    }
                    else{
                        let newUser = new userData({
                            username: theUsername,
                            password: newPassword,
                            referralID:  Math.floor(Math.random() * 10000000),
                            date: date
                        })
                        newUser.save().then(result=>{
                            res.render('index', {success:"You have successfully created an account but user with that referral ID doesn't exist"});
                        })  
                    }
                }
            )
        }
	})
}

exports.profile = function(req, res) {
    userData.findOne({username : req.user.username}).then(user=>{
    res.render('user/profile', {user: user});
    }
)}

exports.referred = function(req, res) {
    userData.find({referred : req.user.referralID}).then(user=>{
    res.render('user/referred', {user:user});
})}

exports.user_profile = function(req, res) {
    userData.findOne({username : req.params.id}).then(user=>{
    res.render('user/user_profile', {user:user});
})}

exports.referral_register = async function(req, res, next) {
    const theUsername = req.body.username
    const thePassword = req.body.password
    const newPassword = await bcrypt.hash(thePassword, 10)
    const date = new Date().toTimeString().split(" ")[0];
    const referred = req.params.id
    const { errors, valid } = signup(theUsername, thePassword);
    const { referralIDError, referralValid} = luhnAlgo(theReferral);
    
    userData.findOne({username: theUsername}).then(user=>{
		const theErrors = {};
        if(user !== null){
            theErrors["username_exists"] = "Username already in use"
            email_view(req, res, theErrors);
        }
        else{
            if(!valid || !referralValid){
                rerender_register(req, res, errors, referralIDError);
            }
            userData.findOne({referralID : req.params.id}).then(user=>{
                if(user){
                    const newNo = (Number(user.referralNO) + 1)
                    user.referralNO = newNo
                    user.save();
                    const newUser = new userData({
                        username: theUsername,
                        password: newPassword,
                        referralID:  numberGenerator(),
                        date: date,
                        referred: referred
                    })
                    newUser.save().then(result=>{
                        res.render('index', {success:"Account Creation Successful"})
                    })
                }
                else{
                    let newUser = new userData({
                        username: theUsername,
                        password: newPassword,
                        referralID:  Math.floor(Math.random() * 10000000),
                        date: date,
                    })
                    newUser.save().then(result=>{
                        res.render('index', {success:"You have successfully created an account but user with that referral ID doesn't exist"});
                        }
                    )
                }
            }
        )
    }}
)}

exports.logout = function(req, res, next) {
    req.logout();
    req.session.destroy();
    res.redirect('/')
}