const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const isAdmin = require('../middlewares/isAdmin');
const isAdminOrIsSelf = require('../middlewares/isAdminOrIsSelf');
const isSelf = require('../middlewares/isSelf');



router.get('/', isAdminOrIsSelf,async (req, res) => {
  try {
    const users = await User.find({role: 'user'}).select('-password'); // Don't return the password
    if (!users) {
      return res.status(404).json({ msg: 'No users in the db' });
    }
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user info by ID (for demonstration)
router.get('/:id', isSelf,async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Don't return the password
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update password (only if changePasswordToken is correct)
router.put('/:id/change-password', async (req, res) => {
  const { password, changePasswordToken } = req.body;

  try {
    // Find the user by ID
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the provided token matches
    if (user.changePasswordToken !== changePasswordToken) {
      return res.status(400).json({ msg: 'Invalid password change token' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate a new changePasswordToken after password is changed
    user.changePasswordToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the updated user with the new password and token
    await user.save();

    res.json({ msg: 'Password updated successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete user (for demonstration)
router.delete('/:id', async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await User.findByIdAndRemove(req.params.id);

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
