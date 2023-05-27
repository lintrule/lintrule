import { rest } from "npm:msw";
import { setupServer } from "npm:msw/node";
import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { DocumentRuleResponse, sendRule } from "./rules.ts";

const CHECK_URL = "http://api.lintrule.com/api/check";

function checkServerWithResponse(body: any, status = 200) {
  const server = setupServer(
    // Describe the requests to mock.
    rest.post(CHECK_URL, (_, res, ctx) => {
      return res(ctx.json(body), ctx.status(status));
    })
  );
  return server;
}

Deno.test("sanity checkServerWithResponse", async (t) => {
  await t.step("should return 200", async () => {
    const server = checkServerWithResponse({ title: "Lord of the Rings" });
    server.listen();
    const res = await fetch(CHECK_URL, {
      method: "POST",
    });
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, { title: "Lord of the Rings" });
    server.close();
  });

  await t.step("should return 400 ", async () => {
    const server = checkServerWithResponse({ title: "Lord of the Rings" }, 400);
    server.listen();
    const res = await fetch(CHECK_URL, {
      method: "POST",
    });
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body, { title: "Lord of the Rings" });
    server.close();
  });
});

Deno.test("sendRule", async () => {
  const server = checkServerWithResponse({
    object: "check_response",
    pass: true,
  });
  server.listen();

  const res = await sendRule({
    url: CHECK_URL,
    accessToken: "token",
    documentRule: {
      document: "test",
      rule: "test",
    },
    retries: 1,
  });

  assertEquals(res, {
    object: "check_response",
    pass: true,
  });
});
