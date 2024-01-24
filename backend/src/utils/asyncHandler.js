const asyncHandler = (callbackFn) => {
  return async (req, res, next) => {
    try {
      await callbackFn(req, res, next);
    } catch (error) {
      res.status(error.statusCode).json({
        success: error.success,
        message: error.message,
      });
      throw error; // IMPORTANT: Otherwise the backend will not send error to the client
    }
  };
};

export default asyncHandler;
