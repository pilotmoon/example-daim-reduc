import { z } from "zod";
import { Context, doMain } from "./do.js";
import { WebhookError } from "./errors.js";

// Paddle IP Allowlist
const ipAllowedSandbox = [
  "34.194.127.46",
  "54.234.237.108",
  "3.208.120.145",
  "44.226.236.210",
  "44.241.183.62",
  "100.20.172.113",
];
const ipAllowedProduction = [
  "34.232.58.13",
  "34.195.105.136",
  "34.237.3.244",
  "35.155.119.135",
  "52.11.166.252",
  "34.212.5.7",
];
const ipAllowedDev = [
  process.env.IP_DEV_1,
];

const ZPaddleArgs = z.object({
  p_order_id: z.string(),
  p_quantity: z.string(),
  passthrough: z.string(),
  email: z.string(),
  name: z.string(),
  product: z.string(),
});
type PaddleArgs = z.infer<typeof ZPaddleArgs>;

function assertAccess(ips: string[]) {
  if (ipAllowedSandbox.includes(ips[0])) {
    return;
  }
  if (ipAllowedProduction.includes(ips[0])) {
    return;
  }
  if (ipAllowedDev.includes(ips[0])) {
    return;
  }
  throw new WebhookError(403, "IP address not allowed");
}

export function main(args: any) {
  console.log("Started :)!");
  return doMain(args, (ctx) => {
    assertAccess(ctx.req.ips);
    if (ctx.req.path === "/license") {
      if (ctx.req.method === "POST") {
        createLicense(ctx);
      } else {
        throw new WebhookError(405, "Method not allowed");
      }
    }
  });
}

function createLicense(ctx: Context) {
  // create license
  console.log("create license with args: ", ctx.req.args);
  const paddleArgs = ZPaddleArgs.parse(ctx.req.args);
  console.log("paddleArgs: ", paddleArgs);
  ctx.res.body = "foo";
  ctx.res.status = 200;
}

function verifySignature(args: object) {
}
