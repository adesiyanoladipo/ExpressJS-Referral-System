var express = require('express');
var router = express.Router();
var usersRoutes = require('../controllers/users')
const {hasAuth} = require('../middleware/hasAuth')

router.get('/login', usersRoutes.get_login);
router.post('/login', usersRoutes.login);
router.get('/logout', hasAuth, usersRoutes.logout);

router.get('/register', usersRoutes.get_register)
router.post('/register', usersRoutes.register)

router.get('/register/rl:id', usersRoutes.get_referral_register)
router.post('/register/rl:id', usersRoutes.referral_register)

router.get('/referred', hasAuth, usersRoutes.referred)
router.get('/profile', hasAuth, usersRoutes.profile)
router.get('/profile/rl:id', hasAuth, usersRoutes.user_profile)

module.exports = router;