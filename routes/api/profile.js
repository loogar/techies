const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');


router.get('/me',auth, async (req, res) =>{
    try{
      const profile = await Profile.findOne({ user: req.users.id }).populate('user', ['name', 'avatar']);

      if(!profile) {
          return res.status(400).json({msg: 'there is no profile for this user'})
      }
      res.json(profile);
    }catch(err){
        console.log(err.message);
        res.status(500).send('server');
    }
});

//create and update a profile
router.post('/', [
    auth, [ 
    check('status', 'status is required').not().isEmpty(),
    check('skills', 'skills is required').not().isEmpty()
]
],
async (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
       return res.status(400).json({errors: errors.array()});
   }

   const {
       company,
       website,
       location,
       bio,
       status,
       githubusername,
       skills,
       youtube,
       facebook,
       twitter,
       instagram,
       linkedin
   } = req.body;

   const profileFields= {};
   profileFields.user = req.users.id;
   if(company) profileFields.company = company;
   if(website) profileFields.website = website;
   if(location) profileFields.location = location;
   if(bio) profileFields.bio = bio;
   if(status) profileFields.status = status;
   if(githubusername) profileFields.githubusername = githubusername;
   if(skills) {
       profileFields.skills = skills.split(',').map(skill => skill.trim());
   }
   profileFields.social = {}
   if(youtube) profileFields.social.youtube = youtube;
   if(twitter) profileFields.social.twitter = twitter;
   if(facebook) profileFields.social.facebook = facebook;
   if(linkedin) profileFields.social.linkedin = linkedin;
   if(instagram) profileFields.social.instagram = instagram;

   try {

    let profile = await Profile.findOne({user: req.users.id});

    if(profile){
        profile = await Profile.findOneAndUpdate(
            { user: req.users.id}, 
            {$set: profileFields}, 
            {new: true}
            );
            return res.json(profile);
    }

    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);

   }catch(err){
       console.error(err.message);
       res.status(500).send('server error');
   }

});

//get all profiles
router.get('/', async (req, res) => {
   try {
       const profiles = await Profile.find().populate('user', ['name', 'avatar']);
       res.json(profiles);
       
   } catch (err) {
       console.log(err.message);
       res.status(500).send('server Error')
   }
});

//get profile ny userid
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);
        
        if(!profile) return res.status(400).json({msg: 'there is no profile for this user'});
        res.json(profile);
        
    } catch (err) {
        console.log(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'profile not found' });
        }
        res.status(500).send('server Error')
    }
 });
 
 // delete profile and user
 router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.users.id });

        await User.findOneAndRemove({ _id: req.users.id });

        res.json({msg: 'user/profile deleted'});
        
    } catch (err) {
        console.log(err.message);
        res.status(500).send('server Error')
    }
 });

 //put add profile expirence

 router.put('/experience', [auth, [
     check('title', 'title is required')
     .not()
     .isEmpty(),
     check('company', 'company is required')
     .not()
     .isEmpty(),
     check('from', 'from date is required')
     .not()
     .isEmpty()
 ]], 
 async (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
       return res.status(400).json({errors: errors.array()});
   }

   const {
       title,
       company,
       location,
       from,
       to,
       current,
       description
   } = req.body;

   const newExpirence = {
       title,
       company,
       location,
       from,
       to,
       current,
       description
   }

   try {
       const profile = await Profile.findOne({ user: req.users.id});
       profile.experience.unshift(newExpirence);
       await profile.save();
       res.json(profile);
   } catch (err) {
       console.error(err.message);
       res.status.send('Server error');      
   }
 });

 //delete expirience
 router.delete('/experience/:exp_id', auth, async(req, res) => {
     try {
        const profile = await Profile.findOne({ user: req.users.id});

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
     } catch (err) {
          console.error(err.message);
       res.status.send('Server error'); 
     }
 });

//add profile education
 router.put('/education', [auth, [
    check('school', 'school is required')
    .not()
    .isEmpty(),
    check('degree', 'degree is required')
    .not()
    .isEmpty(),
    check('fieldofstudy', 'FieldofStudy is required')
    .not()
    .isEmpty(),
    check('from', 'from date is required')
    .not()
    .isEmpty()
]], 
async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
  }

  const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
  } = req.body;

  const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
  }

  try {
      const profile = await Profile.findOne({ user: req.users.id});
      profile.education.unshift(newEducation);
      await profile.save();
      res.json(profile);
  } catch (err) {
      console.error(err.message);
      res.status.send('Server error');      
  }
});

//delete education
router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
       const profile = await Profile.findOne({ user: req.users.id});

       const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

       profile.education.splice(removeIndex, 1);

       await profile.save();

       res.json(profile);
    } catch (err) {
         console.error(err.message);
      res.status.send('Server error'); 
    }
});

//add git repositories
router.get('/github/:username', (req, res) => {
  try {
      const option = {
        uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get(
            'githubClientId')}&client_secret=${config.get('githubSecret')}`,
        method: 'GET',
        headers: {'user-agent': 'node.js'}
      }

      request(option, (error, response, body) => {
          if(error) console.error(error);

          if(response.statusCode != 200){
              res.status(404).json({msg: 'no github profile found'});
          }

          res.json(JSON.parse(body));
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
module.exports = router;