import { STATUS_CODES } from "node:http";
import { TransformStreamDefaultController } from "node:stream/web";
import { z } from "zod";
import { formatResponse, getErrorInfo, WebhookError } from "./errors";

// this is passed by digitalocean to the function int the "http" object of the args.
// assumes raw-http mode.
const ZFunctionArgs = z.object({
  http: z.object({
    headers: z.record(z.string()),
    method: z.string(),
    path: z.string(),
  }),
});
type FunctionArgs = z.infer<typeof ZFunctionArgs>;

// this is the context object passed to the function.
export interface Context {
  req: {
    args: unknown;
    headers: Record<string, unknown>;
    method: string;
    path: string;
    ips: string[];
  };
  res: {
    body?: string | object;
    status?: number;
    headers?: Record<string, string>;
  };
}

// function to filter the args to remove the "http" object and any
// key that start with __
function filterArgs(args: any) {
  const result: any = {};
  for (const key in args) {
    if (key !== "http" && !key.startsWith("__")) {
      result[key] = args[key];
    } else {
      console.log("filtering out key: ", key);
    }
  }
  return result;
}

// Wrap the function in a handler that will pass the args in a koa-like context object.
// Note that the args are a combination of the body params and the query params.
// The function can set the body, status code and headers on the context object.
// The default status code is 404.
// The function will catch and handle any errors thrown by the function.
export function doMain(args: any, fn: (ctx: Context) => void | Promise<void>) {
  // create the context object
  const ctx: Context = {
    req: {
      args: {},
      headers: {},
      method: "",
      path: "",
      ips: [],
    },
    res: {},
  };

  // try
  try {
    // validate the args
    const functionArgs = ZFunctionArgs.parse(args);
    ctx.req.headers = functionArgs.http.headers;
    ctx.req.method = functionArgs.http.method;
    ctx.req.path = functionArgs.http.path;
    ctx.req.args = filterArgs(args);

    console.log(ctx.req.method + " " + ctx.req.path);

    const xff = ctx.req.headers["x-forwarded-for"];
    if (typeof xff === "string") {
      ctx.req.ips = xff.split(",");
    }

    fn(ctx);
  } catch (err) {
    const errorInfo = getErrorInfo(err);
    ctx.res.status = errorInfo.status;
    ctx.res.body = formatResponse(errorInfo);
  }

  // this is the format that digitalocean expects
  console.log("res", ctx.res);
  return {
    body: ctx.res.body ?? "",
    statusCode: ctx.res.status ?? (ctx.res.body ? 200 : 404),
    headers: ctx.res.headers,
  };
}
