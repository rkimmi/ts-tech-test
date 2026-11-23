import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AddInsight } from "./add-insight.tsx";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const setup = () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<AddInsight open onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated };
};

const fillAndSubmit = (brand: string, text: string) => {
  fireEvent.change(screen.getByLabelText("Brand"), {
    target: { value: brand },
  });
  fireEvent.change(screen.getByLabelText("Insight"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add insight" }));
};

describe("AddInsight", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("posts the insight, then reports it and closes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      json(201, {
        id: 7,
        brandId: 3,
        date: "2026-11-23T00:00:00.000Z",
        text: "Hello",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { onClose, onCreated } = setup();

    fillAndSubmit("3", "  Hello  ");

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/insights",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ brandId: 3, text: "Hello" }),
      }),
    );
    expect(onCreated).toHaveBeenCalledWith({
      id: 7,
      brandId: 3,
      date: new Date("2026-11-23T00:00:00.000Z"),
      text: "Hello",
    });
  });

  it("validates locally without calling the server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { onClose } = setup();

    fillAndSubmit("1", "   ");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "String must contain at least 1 character(s)",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows field errors from a 400 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json(400, {
          error: { formErrors: [], fieldErrors: { text: ["Too spicy"] } },
        }),
      ),
    );
    const { onClose, onCreated } = setup();

    fillAndSubmit("1", "Hot take");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Too spicy",
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows a form error when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 500, statusText: "Server Error" }),
      ),
    );
    const { onClose } = setup();

    fillAndSubmit("1", "Hello");

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Request failed: 500 Server Error",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Add insight" })
        .disabled,
    ).toBe(false);
  });
});
