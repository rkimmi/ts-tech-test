import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { stub } from "@std/testing/mock";
import * as oak from "@oak/oak";
import { Database } from "@db/sqlite";
import { errorHandler, type Logger, requestLogger } from "./middleware.ts";
import { withDB } from "./testing.ts";
import { createApp } from "./router.ts";

const spyLogger = () => {
  const calls = { info: [] as unknown[][], error: [] as unknown[][] };
  const logger: Logger = {
    info: (...args: unknown[]) => calls.info.push(args),
    error: (...args: unknown[]) => calls.error.push(args),
  };
  return { logger, calls };
};

describe("request logging", () => {
  withDB((fixture) => {
    it("logs one line with method, path, status and duration", async () => {
      const { logger, calls } = spyLogger();
      const app = createApp({ ...fixture, logger });

      await app.handle(new Request("http://localhost/v1/insights/42"));

      expect(calls.info).toEqual([
        [expect.stringMatching(/^GET \/v1\/insights\/42 404 \d+ms$/)],
      ]);
      expect(calls.error).toEqual([]);
    });
  });
});

describe("unhandled errors", () => {
  // No table created, so the DB query throws here
  const db = new Database(":memory:");
  afterAll(() => db.close());

  it("returns a generic 500 and logs the error", async () => {
    const { logger, calls } = spyLogger();
    const app = createApp({ db, logger });

    const res = await app.handle(new Request("http://localhost/v1/insights"));

    expect(res?.status).toBe(500);
    expect(await res?.json()).toEqual({ error: "Internal Server Error" });
    expect(calls.error).toHaveLength(1);
    expect(calls.error[0][0]).toBe("Unhandled error on GET /v1/insights");
    expect(calls.info).toEqual([
      [expect.stringMatching(/^GET \/v1\/insights 500 \d+ms$/)],
    ]);
  });
});

describe("thrown HttpErrors", () => {
  const appThrowing = (err: Error, logger: Logger) => {
    const app = new oak.Application();
    app.use(errorHandler(logger));
    app.use(() => {
      throw err;
    });
    return app;
  };

  it("keeps a 4xx status and exposed message without logging", async () => {
    const { logger, calls } = spyLogger();
    const app = appThrowing(oak.createHttpError(404, "Nope"), logger);

    const res = await app.handle(new Request("http://localhost/"));

    expect(res?.status).toBe(404);
    expect(await res?.json()).toEqual({ error: "Nope" });
    expect(calls.error).toEqual([]);
  });

  it("keeps a non-exposed 4xx status but hides its message", async () => {
    const { logger, calls } = spyLogger();
    const app = appThrowing(
      oak.createHttpError(400, "secret detail", { expose: false }),
      logger,
    );

    const res = await app.handle(new Request("http://localhost/"));

    expect(res?.status).toBe(400);
    expect(await res?.json()).toEqual({ error: "Bad Request" });
    expect(calls.error).toEqual([]);
  });

  it("keeps a 5xx status, hides its message and logs it", async () => {
    const { logger, calls } = spyLogger();
    const app = appThrowing(oak.createHttpError(503, "db down"), logger);

    const res = await app.handle(new Request("http://localhost/"));

    expect(res?.status).toBe(503);
    expect(await res?.json()).toEqual({ error: "Service Unavailable" });
    expect(calls.error).toHaveLength(1);
  });
});

describe("direct console calls", () => {
  it("are not captured by the middleware logger", async () => {
    const { logger, calls } = spyLogger();
    const app = new oak.Application();
    app.use(requestLogger(logger));
    app.use(errorHandler(logger));
    app.use((ctx) => {
      console.log("from a route");
      ctx.response.status = 200;
    });

    const consoleLog = stub(console, "log");
    try {
      await app.handle(new Request("http://localhost/"));
    } finally {
      consoleLog.restore();
    }

    expect(consoleLog.calls.map((c) => c.args)).toEqual([["from a route"]]);
    expect(calls.info).toEqual([[expect.stringMatching(/^GET \/ 200 \d+ms$/)]]);
    expect(calls.error).toEqual([]);
  });
});
