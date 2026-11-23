import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "./fetch-with-retry.ts";

const response = (status: number) => new Response(null, { status });

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the response on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("/x", { delayMs: 0 });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient statuses then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("/x", { delayMs: 0 });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries network errors", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("/x", { delayMs: 0 });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient statuses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(404));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("/x", { delayMs: 0 })).rejects.toThrow("404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausted max attempts", async () => {
    const maxAttempts = 3;
    const fetchMock = vi.fn().mockResolvedValue(response(500));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("/x", { maxAttempts, delayMs: 0 })).rejects
      .toThrow("500");
    expect(fetchMock).toHaveBeenCalledTimes(maxAttempts);
  });

  it("doubles the retry delay between each attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(500));
    vi.stubGlobal("fetch", fetchMock);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    await expect(fetchWithRetry("/x", { maxAttempts: 4, delayMs: 1 })).rejects
      .toThrow("500");

    const delays = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
    expect(delays).toEqual([1, 2, 4]);
  });

  it("caps the delay at maxDelayMs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(500));
    vi.stubGlobal("fetch", fetchMock);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    await expect(
      fetchWithRetry("/x", { maxAttempts: 5, delayMs: 1, maxDelayMs: 3 }),
    ).rejects.toThrow("500");

    const delays = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
    expect(delays).toEqual([1, 2, 3, 3]);
  });

  it("stops waiting when aborted during the delay", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue(response(503));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchWithRetry("/x", {
      delayMs: 10_000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 0);

    await expect(promise).rejects.toThrow(/abort/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not wait if request was aborted before the delay starts", async () => {
    const controller = new AbortController();
    // Abort after the response arrives but before the retry delay begins
    const fetchMock = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.resolve(response(503));
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry("/x", { delayMs: 10_000, signal: controller.signal }),
    ).rejects.toThrow(/abort/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
