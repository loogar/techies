const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = express.Router();
const {check, validationResult} = require('express-validator');

const User = require('../../models/User')
router.post('/',[
    check('name', 'name is required').not().isEmpty(),
    check('email', 'email is required').isEmail(),
    check('password', 'choose a password with atleast 6 character').isLength({min: 6}),
] ,
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} = req.body;

          //checking existing user

    try {
        let user = await User.findOne({ email });
        if(user) {
           return res.status(400).json({errors: [{msg: 'user already exists'}]});
        }

        const avatar = gravatar.url(email, {
            size: '200',
            rating: 'pg',
            default: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        //password
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();
   
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