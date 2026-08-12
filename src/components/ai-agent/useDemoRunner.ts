"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoStep } from "@/lib/demoScenario";

export type DemoStatus = "idle" | "running" | "paused" | "finished";

type Options = {
  steps: DemoStep[];
  onStep: (step: DemoStep) => void;
  onType: (value: string) => void;
};

export function useDemoRunner({ steps, onStep, onType }: Options) {
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [speed, setSpeedState] = useState(1);
  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef<DemoStatus>("idle");
  const speedRef = useRef(1);

  const setRunnerStatus = useCallback((next: DemoStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const wait = useCallback((duration: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    let remaining = duration;
    let previous = performance.now();
    const tick = () => {
      if (signal.aborted) {
        reject(new DOMException("Demo cancelled", "AbortError"));
        return;
      }
      const current = performance.now();
      if (statusRef.current !== "paused") remaining -= (current - previous) * speedRef.current;
      previous = current;
      if (remaining <= 0) resolve();
      else window.setTimeout(tick, Math.min(50, Math.max(8, remaining / speedRef.current)));
    };
    window.setTimeout(tick, 16);
  }), []);

  const start = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunnerStatus("running");

    void (async () => {
      try {
        for (const step of steps) {
          if (controller.signal.aborted) return;
          if (step.type === "typeInput") {
            onType("");
            const interval = step.charMs ?? Math.max(8, (step.fillMs ?? 400) / Math.max(1, step.text.length));
            for (let index = 1; index <= step.text.length; index += 1) {
              await wait(interval, controller.signal);
              onType(step.text.slice(0, index));
            }
          } else {
            onStep(step);
          }
          if (step.hold) await wait(step.hold, controller.signal);
        }
        setRunnerStatus("finished");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      }
    })();
  }, [onStep, onType, setRunnerStatus, steps, wait]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunnerStatus("idle");
  }, [setRunnerStatus]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "running") setRunnerStatus("paused");
    else if (statusRef.current === "paused") setRunnerStatus("running");
  }, [setRunnerStatus]);

  const setSpeed = useCallback((value: number) => {
    speedRef.current = value;
    setSpeedState(value);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, speed, start, stop, togglePause, setSpeed };
}
