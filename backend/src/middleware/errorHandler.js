const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error
  let error = {
    statusCode: 500,
    message: 'Internal Server Error'
  };

  // Validation error (from Mongoose or Joi)
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = err.message;
  }

  // Cast error (invalid ObjectID in Mongoose)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = 'Invalid ID format';
  }

  // MongoDB server error (e.g., connection issues or duplicates)
  if (err.name === 'MongoServerError') {
    error.statusCode = 500;
    error.message = 'Database operation failed';
    if (err.code === 11000) { // Duplicate key error
      error.statusCode = 409;
      error.message = 'Duplicate entry';
    }
  }

  res.status(error.statusCode).json({
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler;
