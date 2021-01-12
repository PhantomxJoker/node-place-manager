const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../middlewares/file-upload');
const usersController = require('../controllers/users-controller')

const router = express.Router();

router.get('/', usersController.getAllUsers);
router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength(6),
  ],
  usersController.signup,
)
router.post('/login', usersController.login)

module.exports = router;
