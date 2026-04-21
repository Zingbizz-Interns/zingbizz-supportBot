import { afterEach, describe, expect, it, vi } from "vitest";
import { scrapeWebsite } from "@/lib/ingestion/scraper";

vi.mock("dns/promises", () => ({
  default: {
    lookup: vi.fn().mockResolvedValue([{ address: "142.250.190.14" }]),
  },
}));

describe("scrapeWebsite", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies anti-bot responses as blocked", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("<html><title>Just a moment...</title></html>", {
        status: 403,
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      })
    );

    const result = await scrapeWebsite(
      "https://medium.com/google-cloud/google-cloud-armors-crs-v4-22-what-changed-and-how-to-roll-it-out-safely-846d95b326b6",
      10
    );

    expect(result.pages).toEqual([]);
    expect(result.failureReason).toBe("blocked");
  });
});
