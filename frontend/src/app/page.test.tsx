import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "./page";

vi.mock("@/components/site-header", () => ({
  SiteHeader: () => null,
}));

describe("home page", () => {
  it("renders the main heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Organiza el día con Deimiantask",
      }),
    ).toBeDefined();
  });
});