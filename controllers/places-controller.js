const fs = require('fs');
const mongoose = require('mongoose');

const getCoordsFromAddress = require('../utils/location');
const inputErrorValidator = require('../utils/input');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');

const getAllPlaces = async (req, res, next) => {
  let places;

  try {
    places = await Place.find();
  } catch (error) {
    return next(new HttpError('Something went wrong. Could not get places. ' + error, 500));
  }

  res.json(places.map(place => place.toObject({ getters: true })));
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError('Something went wrong. Our ants has been exploding :(. ' + error, 500));
  }

  if (!place) {
    return next(new HttpError('Could not find a place for the provided id.', 404));
  }

  res.json(place.toObject({ getters: true }));
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(new HttpError('Something went wrong. Our ants has been exploding :(', 500));
  }

  console.log(places);
  if (!places || !places.length) {
    return next(new HttpError('Could not find a place for the provided user id.', 404));
  }

  res.json(places.map(place => place.toObject({ getters: true })));
};

const createPlace = async (req, res, next) => {
  inputErrorValidator(req, res, next);

  const { body: { title, description, address } } = req;
  let coordinates;
  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    return next(new HttpError('Place could not be created by an user error', 500));
  }

  try {
    coordinates = await getCoordsFromAddress();
  } catch (e) {
    return next(e);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  try {
    // The session is created for execute all the task only when all are successfully
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();
    await createdPlace.save({ session: mongooseSession });
    user.places.push(createdPlace);
    await user.save({ session: mongooseSession });
    await mongooseSession.commitTransaction();
  } catch (error) {
    return next(new HttpError('Place creation has been failed, please try again', 500));
  }
  res.status(201).json(createdPlace);
};

const updatePlaceById = async (req, res, next) => {
  inputErrorValidator(req, res, next);

  const { body: { title, description } } = req;
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);

    if (place.creator.toString() !== req.userData.userId) {
      throw new HttpError('Are you sure that you create this?', 401)
    }

    place.title = title;
    place.description = description;
    await place.save()
  } catch (error) {
    const httpError = new HttpError('Something went wrong. Place could not be updated', error.code || 500);
    httpError.setDetails(error.message);
    return next(httpError);
  }

  res.status(200).json(place.toObject({ getters: true }));
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    const mongooseSession = await mongoose.startSession();
    place = await Place.findById(placeId).populate('creator');
    const imagePath = place.image;

    if (place.creator.id !== req.userData.userId) {
      throw new HttpError('Are you sure that you create this?', 401)
    }

    mongooseSession.startTransaction();
    await place.remove({ session: mongooseSession });
    place.creator.places.pull(place);
    await place.creator.save({ session: mongooseSession });
    await mongooseSession.commitTransaction();

    fs.unlink(imagePath, err => {
      console.log(err);
    });
  } catch (e) {
    const error = new HttpError('Something went wrong, could not delete the place.', e.code || 500);
    error.setDetails(e.message);
    return next(error);
  }
  res.status(200).json({ message: 'Deleted place'})
}

exports.getAllPlaces = getAllPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
