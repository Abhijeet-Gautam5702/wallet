const asyncHandler = (callbackFn) => {
  return async (req, res, next) => {
    try {
      await callbackFn(req, res, next);
    } catch (error) {
      res.status(error.statusCode).json({
        success: error.success,
        message: error.message,
      });
      // throw err; // IMPORTANT:  The backend will stop forever once any error is found in any API-route
    }
  };
};

export default asyncHandler;
