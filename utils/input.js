const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

const inputErrorValidator = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422);
    const error = new HttpError('Invalid input passed, please check your data', 422);
    error.setInputErrors(errors);
    // next works better in async functions
    return next(error);
  }
};

module.exports = inputErrorValidator;
