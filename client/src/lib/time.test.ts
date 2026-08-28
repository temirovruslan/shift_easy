import { describe, expect, it } from "vitest";
import { formatDuration, splitDuration } from "./time";

describe("formatDuration", () => {
  it("keeps the minutes that are not a whole hour", () => {
    // The regression this module exists for: the worker's period total used
    // to render this as "7h" and lose fifty minutes of their own work.
    expect(formatDuration(470)).toBe("7h 50m");
  });

  it("omits the minutes only when there are none", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("omits the hours below one", () => {
    expect(formatDuration(50)).toBe("50m");
    expect(formatDuration(1)).toBe("1m");
    expect(formatDuration(0)).toBe("0m");
  });

  it("handles a month's worth of minutes", () => {
    expect(formatDuration(9_871)).toBe("164h 31m");
  });

  it("rounds a fractional minute rather than truncating it", () => {
    expect(formatDuration(59.6)).toBe("1h");
  });

  it("treats a negative duration as zero rather than rendering nonsense", () => {
    expect(formatDuration(-5)).toBe("0m");
  });
});

describe("splitDuration", () => {
  it("splits into hours and the remaining minutes", () => {
    expect(splitDuration(470)).toEqual({ hours: 7, minutes: 50 });
    expect(splitDuration(59)).toEqual({ hours: 0, minutes: 59 });
    expect(splitDuration(60)).toEqual({ hours: 1, minutes: 0 });
  });
});
