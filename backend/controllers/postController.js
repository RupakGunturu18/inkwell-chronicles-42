const Post = require('../models/Post');

// Get all published posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('authorId', 'name profileImage') // Only name and image
      .select('title authorId createdAt tags coverImage') // Strictly minimum fields
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'name username profileImage bio')
      .populate('comments.user', 'name username profileImage')
      .lean();

    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user drafts
exports.getUserDrafts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const drafts = await Post.find({
      authorId: req.user._id,
      status: 'draft'
    })
      .populate('authorId', 'name username profileImage')
      .select('title author authorId createdAt tags coverImage coverImagePosition')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.status(200).json(drafts);
  } catch (error) {
    console.error('Error in getUserDrafts:', error);
    res.status(500).json({ message: 'Error fetching drafts', error: error.message });
  }
};

// Get user published posts
exports.getMyPosts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const posts = await Post.find({
      authorId: req.user._id,
      status: 'published'
    })
      .populate('authorId', 'name username profileImage')
      .select('title author authorId createdAt tags coverImage coverImagePosition')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error in getMyPosts:', error);
    res.status(500).json({ message: 'Error fetching your posts', error: error.message });
  }
};

// Create a new post or draft
exports.createPost = async (req, res) => {
  try {
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user.name,
      authorId: req.user._id,
      status: req.body.status || 'published',
      tags: req.body.tags,
      coverImage: req.body.coverImage,
      coverImagePosition: req.body.coverImagePosition,
    });

    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only author can edit
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.status = req.body.status || post.status;
    post.tags = req.body.tags || post.tags;
    post.coverImage = req.body.coverImage || post.coverImage;
    post.coverImagePosition = req.body.coverImagePosition !== undefined ? req.body.coverImagePosition : post.coverImagePosition;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only author can delete
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.user._id);
    if (index === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Comment on a post
exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = {
      user: req.user._id,
      text: req.body.text
    };

    post.comments.push(comment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'name username profileImage');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};