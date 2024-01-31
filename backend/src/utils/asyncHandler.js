const asyncHandler = (callbackFn) => {
  return async (req, res, next) => {
    try {
      await callbackFn(req, res, next);
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: error.success,
        statusCode: error.statusCode || 500,
        message: error.message,
      });
      // throw error; // IMPORTANT:  The backend will stop forever once any error is found in any API-route
    }
  };
};

export default asyncHandler;
