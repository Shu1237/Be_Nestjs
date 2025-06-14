
export class ResponseUtil {
  static withData<T>(data: T, message: string, statusCode = 200) {
    return {
      statusCode,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      statusCode,
      message,
    };
  }

  static success(message: string) {
    return {
      status: 'success',
      message,
    };
  }
}
