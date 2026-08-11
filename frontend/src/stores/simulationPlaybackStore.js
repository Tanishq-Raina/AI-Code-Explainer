import { create } from "zustand";
import { buildComplexityBuilderSteps } from "../simulator/complexityBuilder";

const DEFAULT_SPEEDS = [0.5, 1, 1.5, 2, 3];

function appendUnique(history, nextStep) {
  if (!nextStep) return history;
  const last = history[history.length - 1];
  if (last?.stepId === nextStep.stepId) return history;
  return [...history, nextStep];
}

function clampIndex(index, stepsLength) {
  if (!stepsLength) return -1;
  return Math.max(0, Math.min(index, stepsLength - 1));
}

function buildDerivedTimelineState(steps = [], complexityTimeline = { steps: [], finalComplexity: "-" }, currentIndex = -1) {
  const currentStepIndex = clampIndex(currentIndex, steps.length);
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] || null : null;
  const activeLine = currentStep?.lineNumber ?? null;

  const complexitySteps = complexityTimeline?.steps || [];
  const activeComplexityIndex = clampIndex(currentStepIndex, complexitySteps.length);
  const activeEvent = activeComplexityIndex >= 0 ? complexitySteps[activeComplexityIndex] || null : null;
  const activeLoops = complexitySteps.filter(
    (step) =>
      step?.event === "show_loop_box" &&
      activeEvent &&
      step.stepId <= activeEvent.stepId,
  );

  return {
    currentStep,
    activeLine,
    activeLoops,
    complexityState: {
      timeline: complexityTimeline,
      currentEvent: activeEvent,
      builderSteps: buildComplexityBuilderSteps({
        activeEvent,
        finalComplexity: complexityTimeline?.finalComplexity || "-",
      }),
      finalComplexity: complexityTimeline?.finalComplexity || "-",
      activeStepIndex: activeComplexityIndex,
    },
  };
}

function buildTimelinePatch(state, steps, complexityTimeline, nextIndex) {
  const normalizedIndex = clampIndex(nextIndex, steps.length);
  const derived = buildDerivedTimelineState(steps, complexityTimeline, normalizedIndex);

  return {
    steps,
    complexityTimeline,
    currentIndex: normalizedIndex,
    isPlaying: false,
    history: normalizedIndex >= 0 ? appendUnique([], steps[normalizedIndex]) : [],
    ...derived,
    autoPlayRequested: state.autoPlayRequested,
  };
}

export const useSimulationPlaybackStore = create((set, get) => ({
  steps: [],
  complexityTimeline: { steps: [], finalComplexity: "-" },
  currentIndex: -1,
  currentStep: null,
  activeLine: null,
  activeLoops: [],
  complexityState: {
    timeline: { steps: [], finalComplexity: "-" },
    currentEvent: null,
    builderSteps: [],
    finalComplexity: "-",
    activeStepIndex: -1,
  },
  isPlaying: false,
  speed: 1,
  stepDelayMs: 160,
  lineToBubbleDelayMs: 620,
  bubbleReadPauseMs: 820,
  soundEnabled: false,
  history: [],
  autoPlayRequested: false,
  speedOptions: DEFAULT_SPEEDS,

  setSimulationData: ({ steps = [], complexityTimeline = { steps: [], finalComplexity: "-" } } = {}) =>
    set((state) => ({
      ...buildTimelinePatch(state, steps, complexityTimeline, steps.length ? 0 : -1),
    })),

  setSteps: (steps = []) =>
    set((state) => buildTimelinePatch(state, steps, state.complexityTimeline, steps.length ? 0 : -1)),

  setComplexityTimeline: (complexityTimeline = { steps: [], finalComplexity: "-" }) =>
    set((state) => buildTimelinePatch(state, state.steps, complexityTimeline, state.currentIndex)),

  requestAutoPlay: () => set({ autoPlayRequested: true }),

  clearAutoPlayRequest: () => set({ autoPlayRequested: false }),

  setCurrentIndex: (index) =>
    set((state) => {
      if (!state.steps.length) return state;
      const clampedIndex = clampIndex(index, state.steps.length);
      const derived = buildDerivedTimelineState(state.steps, state.complexityTimeline, clampedIndex);
      return {
        currentIndex: clampedIndex,
        history: appendUnique(state.history, state.steps[clampedIndex]),
        ...derived,
      };
    }),

  setSpeed: (speed) => set({ speed }),

  setLineToBubbleDelayMs: (lineToBubbleDelayMs) => set({ lineToBubbleDelayMs }),

  setBubbleReadPauseMs: (bubbleReadPauseMs) => set({ bubbleReadPauseMs }),

  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  toggleSoundEnabled: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  play: () => {
    const { steps } = get();
    if (!steps.length) return;
    set({ isPlaying: true });
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { steps, isPlaying } = get();
    if (!steps.length) return;
    set({ isPlaying: !isPlaying });
  },

  stepForward: () =>
    set((state) => {
      if (!state.steps.length) return state;
      const nextIndex = state.currentIndex < 0 ? 0 : state.currentIndex + 1;
      if (nextIndex >= state.steps.length) return { isPlaying: false };
      const derived = buildDerivedTimelineState(state.steps, state.complexityTimeline, nextIndex);
      return {
        currentIndex: nextIndex,
        isPlaying: false,
        history: appendUnique(state.history, state.steps[nextIndex]),
        ...derived,
      };
    }),

  stepBackward: () =>
    set((state) => {
      if (!state.steps.length) return state;
      const nextIndex = Math.max(0, state.currentIndex - 1);
      const derived = buildDerivedTimelineState(state.steps, state.complexityTimeline, nextIndex);
      return {
        currentIndex: nextIndex,
        isPlaying: false,
        history: appendUnique(state.history, state.steps[nextIndex]),
        ...derived,
      };
    }),

  reset: () =>
    set((state) => ({
      currentIndex: state.steps.length ? 0 : -1,
      isPlaying: false,
      history: state.steps.length ? appendUnique([], state.steps[0]) : [],
      ...buildDerivedTimelineState(state.steps, state.complexityTimeline, state.steps.length ? 0 : -1),
    })),

  advance: () =>
    set((state) => {
      if (!state.steps.length) return state;
      if (state.currentIndex >= state.steps.length - 1) {
        return { isPlaying: false };
      }

      const nextIndex = state.currentIndex < 0 ? 0 : state.currentIndex + 1;
      const derived = buildDerivedTimelineState(state.steps, state.complexityTimeline, nextIndex);
      return {
        currentIndex: nextIndex,
        history: appendUnique(state.history, state.steps[nextIndex]),
        ...derived,
      };
    }),
}));
