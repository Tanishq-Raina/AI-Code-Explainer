import { useSimulationPlaybackController } from "./useSimulationPlaybackController";

export function useSimulationPlayback(steps = []) {
  const controller = useSimulationPlaybackController();

  return {
    ...controller,
    resetPlayback: controller.reset,
  };
}
