import * as oak from "@oak/oak";

export type Logger = Pick<Console, "info" | "error">;

/** Logs one line per request: method, path, status and duration */
export const requestLogger = (logger: Logger): oak.Middleware => {
  return async (ctx, next) => {
    const start = performance.now();
    try {
      await next();
    } finally {
      const ms = Math.round(performance.now() - start);
      logger.info(
        `${ctx.request.method} ${ctx.request.url.pathname} ${ctx.response.status} ${ms}ms`,
      );
    }
  };
};

export const errorHandler = (logger: Logger): oak.Middleware => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      const status: oak.ErrorStatus = oak.isHttpError(err) ? err.status : 500;
      const expose = oak.isHttpError(err) && err.expose;

      if (status >= 500) {
        logger.error(
          `Unhandled error on ${ctx.request.method} ${ctx.request.url.pathname}`,
          err,
        );
      }

      ctx.response.status = status;
      ctx.response.body = {
        error: expose ? err.message : oak.STATUS_TEXT[status],
      };
    }
  };
};
