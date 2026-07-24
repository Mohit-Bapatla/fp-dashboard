import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createManagedAutoplayTimer } from "@/lib/marketing/autoplay-timer";

describe("managed hero autoplay timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cancels a pending transition before its timeout", () => {
    const advance = vi.fn();
    const timer = createManagedAutoplayTimer();

    timer.schedule(advance, 800);
    timer.cancel();
    vi.advanceTimersByTime(800);

    expect(advance).not.toHaveBeenCalled();
    expect(timer.isPending()).toBe(false);
  });

  it("invalidates a stale callback at the transition boundary", () => {
    const queuedCallbacks: Array<() => void> = [];
    const advance = vi.fn();
    const timer = createManagedAutoplayTimer({
      clear: vi.fn(),
      schedule: (callback) => {
        queuedCallbacks.push(callback);
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
    });

    timer.schedule(advance, 800);
    timer.cancel();
    queuedCallbacks[0]?.();

    expect(advance).not.toHaveBeenCalled();
  });

  it("keeps only one timer through rapid pause and resume", () => {
    const firstAdvance = vi.fn();
    const resumedAdvance = vi.fn();
    const timer = createManagedAutoplayTimer();

    timer.schedule(firstAdvance, 800);
    timer.cancel();
    timer.schedule(resumedAdvance, 800);
    timer.schedule(resumedAdvance, 800);
    vi.advanceTimersByTime(800);

    expect(firstAdvance).not.toHaveBeenCalled();
    expect(resumedAdvance).toHaveBeenCalledTimes(1);
    expect(timer.isPending()).toBe(false);
  });

  it("clears a pending timer on unmount and refuses future schedules", () => {
    const advance = vi.fn();
    const timer = createManagedAutoplayTimer();

    timer.schedule(advance, 800);
    timer.dispose();
    timer.schedule(advance, 800);
    vi.advanceTimersByTime(1_600);

    expect(advance).not.toHaveBeenCalled();
    expect(timer.isPending()).toBe(false);
  });

  it("stays idle when reduced motion cancels autoplay", () => {
    const advance = vi.fn();
    const timer = createManagedAutoplayTimer();

    timer.schedule(advance, 800);
    timer.cancel();
    vi.advanceTimersByTime(10_000);

    expect(advance).not.toHaveBeenCalled();
  });
});
