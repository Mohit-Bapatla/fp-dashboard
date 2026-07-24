type TimerHandle = ReturnType<typeof setTimeout>;

type TimerScheduler = {
  clear: (handle: TimerHandle) => void;
  schedule: (callback: () => void, delayMs: number) => TimerHandle;
};

export type ManagedAutoplayTimer = {
  cancel: () => void;
  dispose: () => void;
  isPending: () => boolean;
  schedule: (callback: () => void, delayMs: number) => void;
};

const browserTimerScheduler: TimerScheduler = {
  clear: (handle) => clearTimeout(handle),
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
};

export function createManagedAutoplayTimer(
  scheduler: TimerScheduler = browserTimerScheduler,
): ManagedAutoplayTimer {
  let disposed = false;
  let generation = 0;
  let timer: TimerHandle | null = null;

  const cancel = () => {
    generation += 1;
    if (timer !== null) {
      scheduler.clear(timer);
      timer = null;
    }
  };

  return {
    cancel,
    dispose: () => {
      disposed = true;
      cancel();
    },
    isPending: () => timer !== null,
    schedule: (callback, delayMs) => {
      cancel();
      if (disposed) {
        return;
      }

      const scheduledGeneration = generation;
      timer = scheduler.schedule(() => {
        if (disposed || scheduledGeneration !== generation) {
          return;
        }

        timer = null;
        callback();
      }, delayMs);
    },
  };
}
