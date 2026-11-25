import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Insights } from "./insights.tsx";
import type { Insight } from "@suittracker/lib/dtos";

const TEST_INSIGHTS: Insight[] = [
  {
    id: 1,
    brandId: 1,
    date: new Date(),
    text: "Test insight",
  },
  { id: 2, brandId: 2, date: new Date(), text: "Another test insight" },
];

const getDeleteButton = (insight: Insight) =>
  within(screen.getByRole("article", { name: insight.text })).getByRole(
    "button",
    { name: "Delete insight" },
  );

describe("insights", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders", () => {
    const { getByText } = render(<Insights insights={TEST_INSIGHTS} />);
    expect(getByText(TEST_INSIGHTS[0].text)).toBeTruthy();
  });

  it("shows the brand name for each insight", () => {
    render(<Insights insights={TEST_INSIGHTS} />);
    const article = screen.getByRole("article", {
      name: TEST_INSIGHTS[1].text,
    });
    expect(within(article).getByText("Brand 2")).toBeTruthy();
  });

  it("falls back for an unknown brand id", () => {
    render(
      <Insights
        insights={[{ id: 3, brandId: 99, date: new Date(), text: "Orphan" }]}
      />,
    );
    expect(screen.getByText("Unknown brand (99)")).toBeTruthy();
  });

  it("deletes an insight and reports its id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onDeleted = vi.fn();
    render(<Insights insights={TEST_INSIGHTS} onDeleted={onDeleted} />);

    fireEvent.click(getDeleteButton(TEST_INSIGHTS[1]));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(2));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/insights/2", {
      method: "DELETE",
    });
  });

  it("treats a 404 as already deleted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );
    const onDeleted = vi.fn();
    render(<Insights insights={TEST_INSIGHTS} onDeleted={onDeleted} />);

    fireEvent.click(getDeleteButton(TEST_INSIGHTS[0]));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(1));
  });

  it("shows an error and keeps the insight when the delete fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 500, statusText: "Server Error" }),
      ),
    );
    const onDeleted = vi.fn();
    render(<Insights insights={TEST_INSIGHTS} onDeleted={onDeleted} />);

    fireEvent.click(getDeleteButton(TEST_INSIGHTS[0]));

    expect((await screen.findByRole("alert")).textContent).toContain("500");
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
