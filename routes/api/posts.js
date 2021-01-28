const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');



//create a post
router.post('/', [auth, [
    check('text', 'text is required').not().isEmpty()
]],
async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
     return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.users.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.users.id
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server Error');
    }
});

//get all posts
router.get('/', auth, async(req, res) => {
try {
    const posts = await Post.find().sort({date: -1});
    res.json(posts);
    
} catch (err) {
    console.error(err.message);
    res.status(500).send('server Error');
}
});

//get posts by id
router.get('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
           return res.status(400).json({msg: 'Post not found'});
        }
        res.json(post);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Post not found'});
         }
        res.status(500).send('server Error');
    }
    });

    //delete posts
router.delete('/:id', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(post.user.toString() !== req.users.id) {
           return res.status(401).json({msg: 'user not authorized'});
        }

        if(!post) {
            return res.status(400).json({msg: 'Post not found'});
         }

        await post.remove();
        res.json({ msg: 'post removed'});
        
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(400).json({msg: 'Post not found'});
         }
        res.status(500).send('server Error');
    }
    });

    //like post
    router.put('/like/:id', auth, async(req, res) => {
        try {
            const post = await Post.findById(req.params.id);
    
            if(post.likes.filter(like => like.user.toString() === req.users.id).length > 0) {
               return res.status(400).json({msg: 'post already liked'});
            }

            post.likes.unshift({user: req.users.id});

            await post.save();
            res.json(post.likes);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server Error');
        }
        });


         //unlike post
    router.put('/unlike/:id', auth, async(req, res) => {
        try {
            const post = await Post.findById(req.params.id);
    
            if(post.likes.filter(like => like.user.toString() === req.users.id).length === 0) {
               return res.status(400).json({msg: 'post has not been liked'});
            }

          const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.users.id);
          post.likes.splice(removeIndex, 1);
            await post.save();
            res.json(post.likes);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server Error');
        }
        });


//comment on a post
router.post('/comment/:id', [auth, [
    check('text', 'text is required').not().isEmpty()
]],
async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
     return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.users.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.users.id
        };

        post.comments.unshift(newComment);

    await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server Error');
    }
});

//delete a comment on post
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {

   
    try {
        const post = await Post.findById(req.params.id);

        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        if(!comment) {
            return res.status(404).json({msg: 'comment does not exist'});
        }

        if(comment.user.toString() !== req.users.id){
            return res.status(401).jason({msg: 'user not authorized'});
        }
       
        const removeIndex = post.comments
        .map(comment => comment.user.toString()).indexOf(req.users.id);

        post.comments.splice(removeIndex, 1);

          await post.save();

          res.json(post.comments);
       
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server Error');
    }
});
module.exports = router;