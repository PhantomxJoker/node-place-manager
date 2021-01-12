const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../middlewares/check-auth');
const fileUpload = require('../middlewares/file-upload');
const placesController = require('../controllers/places-controller')

const router = express.Router();

router.get('/', placesController.getAllPlaces);
router.get('/:pid', placesController.getPlaceById);
router.get('/user/:uid', placesController.getPlacesByUserId);

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title').not().isEmpty(),
    check('description').isLength(5),
    check('address').not().isEmpty(),
  ],
  placesController.createPlace
);
router.patch(
  '/:pid', [
    check('title').not().isEmpty(),
    check('description').isLength(5),
  ],
  placesController.updatePlaceById
);
router.delete('/:pid', placesController.deletePlace);

module.exports = router;
