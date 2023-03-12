import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { STATUS_CODES } from "node:http";

export class WebhookError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}

// type to represent information about an error
interface ErrorInfo {
  message: string;
  type: string;
  status: number;
}

// extract concrete info from an unknown error
export function getErrorInfo(error: unknown): ErrorInfo {
  // get some kind of message
  let message;
  if (error instanceof ZodError) {
    message = fromZodError(error).message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  // try to get type name from error
  let type = "UnknownError";
  if (
    typeof error === "object" && error !== null &&
    "name" in error && typeof error.name === "string"
  ) {
    type = error.name;
  }

  // adjust status code for known errors
  let status = 500;
  if (error instanceof WebhookError) {
    status = error.status;
  } else if (error instanceof ZodError) {
    status = 400;
  }

  return { message, type, status };
}

export function httpStatusString(code: number, { showCode = true } = {}) {
  const string = STATUS_CODES[code];
  if (string) {
    return showCode ? `${code} ${string}` : string;
  } else {
    return "???";
  }
}

// format the error info as it will be sent to the client
export function formatResponse(info: ErrorInfo) {
  let result = httpStatusString(info.status, { showCode: false });
  if (info.status < 500) {
    result += ` (${info.message})`;
  }
  return result;
}
