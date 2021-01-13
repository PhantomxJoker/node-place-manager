const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const inputErrorValidator = require('../utils/input');
const HttpError = require('../models/http-error');
const User = require('../models/user');

const getAllUsers = async (req, res, next) => {
  let users;

  try {
    // users = await User.find({}, 'email name id');
    users = await User.find({}, '-password -__v');
  } catch (error) {
    return next(new HttpError('Fetching users failed, please try again', 500));
  }
  res.status(200).json(users.map(user => user.toObject({ getters: true })));
};

const signup = async (req, res, next) => {
  inputErrorValidator(req, res, next);

  const { body: { name, email, password }} = req;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again', 500));
  }

  if (existingUser) {
    return next(new HttpError('The user already exists', 422));
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError('Could not create user, please try again', 500);
    error.setDetails(err.message);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError('User creation has been failed, please try again', 500));
  }

  const token = jwt.sign(
    {
      userId: createdUser.id,
      email: createdUser.email,
    },
    process.env.JWT_KEY,
    {
      expiresIn: '1h',
    }
  );

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
  const { body: { email, password } } = req;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError('Signing up failed, please try again', 500));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError('Could not login, please try again', 500));
  }

  if (!existingUser || !isValidPassword) {
    return next(new HttpError('Could not identify user', 403));
  }

  const token = jwt.sign(
    {
      userId: existingUser.id,
      email: existingUser.email,
    },
    process.env.JWT_KEY,
    {
      expiresIn: '1h',
    }
  );

  res.status(200).json({ userId: existingUser.id, email: existingUser.email, token });
};

exports.getAllUsers = getAllUsers;
exports.signup = signup;
exports.login = login;
