/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ExceptionType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export class AppException extends Error {
  constructor(
    public message: string,
    public type: ExceptionType = ExceptionType.UNKNOWN,
    public statusCode?: number,
    public rawError?: any
  ) {
    super(message);
    this.name = 'AppException';
  }
}

export class NetworkException extends AppException {
  constructor(message: string = 'Network connection error', statusCode?: number, rawError?: any) {
    super(message, ExceptionType.NETWORK, statusCode, rawError);
  }
}

export class AuthException extends AppException {
  constructor(message: string = 'Authentication failed', statusCode?: number, rawError?: any) {
    super(message, ExceptionType.AUTH, statusCode, rawError);
  }
}

export class ServerException extends AppException {
  constructor(message: string = 'Internal server error', statusCode?: number, rawError?: any) {
    super(message, ExceptionType.SERVER, statusCode, rawError);
  }
}

export class ValidationException extends AppException {
  constructor(message: string = 'Validation failed', rawError?: any) {
    super(message, ExceptionType.VALIDATION, 400, rawError);
  }
}
