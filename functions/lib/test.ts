import test from "ava";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import axios, { AxiosInstance } from "axios";

// run shell command to get functon endpoint
// doctl sls fn get <funcName> --url

async function getUrl(name: string): Promise<string> {
  const execa = promisify(exec);
  const { stdout } = await execa(`doctl sls fn get webhooks/${name} --url`);
  return stdout;
}

let paddle: AxiosInstance;
async function setup() {
  paddle = axios.create({
    baseURL: await getUrl("paddle"),
    validateStatus: () => true, // don't throw on non-200 status
  });
}

const samplePaddle = {
  "p_product_id": 41687,
  "p_price": 17,
  "p_country": "US",
  "p_currency": "USD",
  "p_sale_gross": 17,
  "p_tax_amount": 0,
  "p_paddle_fee": 1.35,
  "p_coupon_savings": 0,
  "p_earnings": '{"9710":"15.6500"}',
  "p_order_id": 568892,
  "p_coupon": "",
  "p_used_price_override": true,
  "p_custom_data": null,
  "passthrough": "Example passthrough",
  "email": "blackhole+640603105624e@paddle.com",
  "name": "Test User",
  "product": "com.pilotmoon.popclip",
  "marketing_consent": false,
  "p_quantity": 1,
  "quantity": 1,
  "event_time": "2023-03-06 15:13:20",
};

test.before(setup);

test("get root", async (t) => {
  const res = await paddle.get("");
  t.is(res.status, 404);
});

test("get /", async (t) => {
  const res = await paddle.get("/");
  t.is(res.status, 404);
});

test("get /license", async (t) => {
  const res = await paddle.get("/license");
  t.is(res.status, 405);
});

test("post /license with no body", async (t) => {
  const res = await paddle.post("/license", samplePaddle);
  t.is(res.status, 400);
});
