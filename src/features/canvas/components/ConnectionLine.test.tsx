import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ConnectionLine } from "./ConnectionLine";

describe("ConnectionLine", () => {
  it("renders an SVG path with horizontal orientation", () => {
    const { container } = render(
      <ConnectionLine startX={0} startY={50} endX={200} endY={50} orientation="horizontal" />
    );

    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute("d")).toContain("M 0 50");
    expect(path?.getAttribute("d")).toContain("200 50");
  });

  it("renders an SVG path with vertical orientation", () => {
    const { container } = render(
      <ConnectionLine startX={50} startY={0} endX={50} endY={200} orientation="vertical" />
    );

    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute("d")).toContain("M 50 0");
    expect(path?.getAttribute("d")).toContain("50 200");
  });

  it("defaults to horizontal orientation", () => {
    const { container } = render(
      <ConnectionLine startX={0} startY={0} endX={100} endY={100} />
    );

    const path = container.querySelector("path");
    // Horizontal: midX control points
    const d = path?.getAttribute("d") ?? "";
    expect(d).toContain("M 0 0");
    // midX = 50, so cp1 = (50, 0), cp2 = (50, 100)
    expect(d).toContain("C 50 0, 50 100, 100 100");
  });

  it("uses gradient stroke", () => {
    const { container } = render(
      <ConnectionLine startX={0} startY={0} endX={100} endY={100} />
    );

    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("url(#connection-gradient)");
  });
});
