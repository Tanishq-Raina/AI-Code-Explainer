import { useEffect, useMemo, useRef } from "react";
import { useSimulationPlaybackStore } from "../stores/simulationPlaybackStore";

export function useSimulationPlaybackController() {
  const setSimulationData = useSimulationPlaybackStore((state) => state.setSimulationData);
  const requestAutoPlay = useSimulationPlaybackStore((state) => state.requestAutoPlay);
  const clearAutoPlayRequest = useSimulationPlaybackStore((state) => state.clearAutoPlayRequest);
  const timelineSteps = useSimulationPlaybackStore((state) => state.steps);
  const isPlaying = useSimulationPlaybackStore((state) => state.isPlaying);
  const speed = useSimulationPlaybackStore((state) => state.speed);
  const stepDelayMs = useSimulationPlaybackStore((state) => state.stepDelayMs);
  const lineToBubbleDelayMs = useSimulationPlaybackStore((state) => state.lineToBubbleDelayMs);
  const bubbleReadPauseMs = useSimulationPlaybackStore((state) => state.bubbleReadPauseMs);
  const soundEnabled = useSimulationPlaybackStore((state) => state.soundEnabled);
  const history = useSimulationPlaybackStore((state) => state.history);
  const currentIndex = useSimulationPlaybackStore((state) => state.currentIndex);
  const currentStep = useSimulationPlaybackStore((state) => state.currentStep);
  const activeLine = useSimulationPlaybackStore((state) => state.activeLine);
  const activeLoops = useSimulationPlaybackStore((state) => state.activeLoops);
  const complexityState = useSimulationPlaybackStore((state) => state.complexityState);
  const speedOptions = useSimulationPlaybackStore((state) => state.speedOptions);
  const setSpeed = useSimulationPlaybackStore((state) => state.setSpeed);
  const setLineToBubbleDelayMs = useSimulationPlaybackStore((state) => state.setLineToBubbleDelayMs);
  const setBubbleReadPauseMs = useSimulationPlaybackStore((state) => state.setBubbleReadPauseMs);
  const toggleSoundEnabled = useSimulationPlaybackStore((state) => state.toggleSoundEnabled);
  const play = useSimulationPlaybackStore((state) => state.play);
  const pause = useSimulationPlaybackStore((state) => state.pause);
  const togglePlay = useSimulationPlaybackStore((state) => state.togglePlay);
  const stepForward = useSimulationPlaybackStore((state) => state.stepForward);
  const stepBackward = useSimulationPlaybackStore((state) => state.stepBackward);
  const advance = useSimulationPlaybackStore((state) => state.advance);
  const reset = useSimulationPlaybackStore((state) => state.reset);

  const canStepForward = useMemo(
    () => currentIndex >= 0 && currentIndex < timelineSteps.length - 1,
    [currentIndex, timelineSteps.length],
  );

  const canStepBackward = useMemo(() => currentIndex > 0, [currentIndex]);

  const loadSimulation = (steps = [], complexityTimeline = { steps: [], finalComplexity: "-" }) => {
    setSimulationData({ steps, complexityTimeline });
  };

  useEffect(() => {
    const hasPendingAutoPlay = useSimulationPlaybackStore.getState().autoPlayRequested;
    if (!hasPendingAutoPlay || !timelineSteps.length) return;

    clearAutoPlayRequest();
    play();
  }, [clearAutoPlayRequest, play, timelineSteps.length]);

  useEffect(() => {
    if (!isPlaying || !useSimulationPlaybackStore.getState().steps.length) return undefined;

    const basePhaseMs = lineToBubbleDelayMs + bubbleReadPauseMs + stepDelayMs;
    const intervalMs = Math.max(700, Math.round(basePhaseMs / Math.max(0.5, speed)));
    const timer = window.setInterval(() => {
      const next = useSimulationPlaybackStore.getState().advance();
      if (!next) return;
      if (useSimulationPlaybackStore.getState().currentIndex >= useSimulationPlaybackStore.getState().steps.length - 1) {
        window.clearInterval(timer);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, stepDelayMs, lineToBubbleDelayMs, bubbleReadPauseMs]);

  const previousStepIdRef = useRef(null);

  useEffect(() => {
    const stepId = currentStep?.stepId || null;
    if (!soundEnabled || !stepId || previousStepIdRef.current === stepId) {
      previousStepIdRef.current = stepId;
      return;
    }

    previousStepIdRef.current = stepId;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = 680;
      gain.gain.value = 0.0001;

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      oscillator.start(now);
      oscillator.stop(now + 0.08);
      oscillator.onended = () => {
        audioCtx.close().catch(() => {});
      };
    } catch {
      // Ignore audio errors (autoplay policy, unsupported context, etc.).
    }
  }, [currentStep, soundEnabled]);

  return {
    currentIndex,
    currentStep,
    activeLine,
    activeLoops,
    complexityState,
    history,
    isPlaying,
    speed,
    stepDelayMs,
    lineToBubbleDelayMs,
    bubbleReadPauseMs,
    soundEnabled,
    speedOptions,
    setSpeed,
    setLineToBubbleDelayMs,
    setBubbleReadPauseMs,
    toggleSoundEnabled,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    requestAutoPlay,
    clearAutoPlayRequest,
    loadSimulation,
    reset,
    canStepForward,
    canStepBackward,
  };
}
