import type { CapsuleId } from '../model/capsules';
import { MutualCapsule, NumbersCapsule, PullCapsule } from './attraction-capsules';
import { CheckCapsule, FormulaCapsule, MassCapsule, PredictCapsule } from './law-capsules';
import { PeriodicCapsule } from './periodic-capsule';
import {
  ChaosCapsule,
  EnergyCapsule,
  LabCapsule,
  ThirdCapsule,
  UnstableCapsule,
} from './three-body-capsules';
import type { Lesson } from './lesson';

const CONTENT: Readonly<Record<CapsuleId, (props: { lesson: Lesson }) => React.ReactNode>> = {
  pull: PullCapsule,
  mutual: MutualCapsule,
  numbers: NumbersCapsule,
  mass: MassCapsule,
  predict: PredictCapsule,
  check: CheckCapsule,
  formula: FormulaCapsule,
  third: ThirdCapsule,
  chaos: ChaosCapsule,
  unstable: UnstableCapsule,
  energy: EnergyCapsule,
  periodic: PeriodicCapsule,
  lab: LabCapsule,
};

// The interaction of one capsule; only the open capsule is mounted, so one WebGL scene at a time.
export function CapsuleContent({ id, lesson }: { id: CapsuleId; lesson: Lesson }) {
  const Content = CONTENT[id];
  return <Content lesson={lesson} />;
}
