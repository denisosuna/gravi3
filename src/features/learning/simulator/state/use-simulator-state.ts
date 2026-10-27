import { useSyncExternalStore } from 'react';
import type { SimulatorController, SimulatorSnapshot } from './simulator-controller';

export function useSimulatorState<T>(
  controller: SimulatorController,
  select: (snapshot: SimulatorSnapshot) => T,
): T {
  const read = () => select(controller.snapshot());
  return useSyncExternalStore(controller.subscribe, read, read);
}
