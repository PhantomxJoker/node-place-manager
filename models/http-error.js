class HttpError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.code = errorCode;

    this.setInputErrors = objectError => {
      this.inputs = objectError.errors;
    };

    this.setDetails = details => {
      this.details = details;
    };
  };
}

module.exports = HttpError;
