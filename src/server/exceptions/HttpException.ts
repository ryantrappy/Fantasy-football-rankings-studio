class HttpException extends Error {
  public status: number;
  public message: string;

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.status = status;
    this.message = message;
  }
}

export default HttpException;
