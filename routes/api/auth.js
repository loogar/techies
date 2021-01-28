const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

const {check, validationResult} = require('express-validator');

const User = require('../../models/User')

router.get('/',auth, async (req, res) => {
    try {
      const user = await User.findById(req.users.id).select('-password');
      res.json(user);
    } catch(err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
});

//user login

router.post('/',[
    check('email', 'email is required').isEmail(),
    check('password', 'password is required').exists(),
] ,
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { email, password} = req.body;

          //checking existing user

    try {
        let user = await User.findOne({ email });
        if(!user) {
           return res.status(400).json({errors: [{msg: 'Invaild credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({errors: [{msg: 'Invaild credentials'}]});
        }

    const payload = {
        user: {
            id: user.id
        }
    }
    jwt.sign(
        payload, 
        config.get('jwtToken'),
        { expiresIn: 360000},
        (err, token) => {
         if(err)throw err;     
         res.json({token})    
        });
    }
    catch(err) {
        console.log(err.message);
        res.status(500).send('server error');
    }
    
    });

module.exports = router;