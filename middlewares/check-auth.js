const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'supersecret_dont_share');

    if (!token) {
      throw new Error('Error on token validation');
    }
    req.userData = {
      userId: decodedToken.userId,
    };
    next();
  } catch (error) {
    const httpError = new HttpError('Authentication failed', 401);
    httpError.setDetails(error.message);
    return next(httpError);
  }

}
