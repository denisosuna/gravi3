import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTheme } from 'next-themes';
import type { ArrowHelper, Group } from 'three';
import type { Experiment } from '@/features/learning/model/experiment';
import { forceLabLayout, VISIBLE_HALF_WIDTH } from './force-lab-layout';
import { scenePalette } from '@/shared/three/scene-palette';
import { GRAVITATIONAL_CONSTANT, gravitationalForce } from '@/physics/gravity';
import { TwoBodySimulation } from '@/physics/two-body-simulation';
import { CameraFit, DistanceRuler, ForceArrow, LEFT, RIGHT } from './force-lab-scene-parts';

const CAMERA_POSITION: [number, number, number] = [0, 0.7, 4];
const FIELD_OF_VIEW_DEGREES = 40;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const NORMALIZED_TIME_PER_SECOND = 0.35;
// Arrows sit above and below the bodies so they stay readable even when the bodies are close.
const ARROW_OFFSET_Y = 0.55;
const RULER_OFFSET_Y = -0.75;
// Camera may swing sideways and tilt a little, never below the floor or upside down.
const POLAR_RANGE = { min: Math.PI / 2 - 0.6, max: Math.PI / 2 + 0.15 } as const;

type ForceLabSceneProps = {
  experiment: Experiment;
  force: number;
  animationRun: number;
  animating: boolean;
  staticPull: boolean;
  onAnimationComplete: (simulatedSeconds: number) => void;
  onContextLost: () => void;
};

function ForceLabContents({
  experiment,
  force,
  animationRun,
  animating,
  staticPull,
  onAnimationComplete,
  palette,
}: ForceLabSceneProps & {
  palette: ReturnType<typeof scenePalette>;
}) {
  const { invalidate } = useThree();
  const { positions, radii, arrowLength } = forceLabLayout(experiment, force);
  const body1 = useRef<Group>(null);
  const body2 = useRef<Group>(null);
  const arrow1 = useRef<ArrowHelper>(null);
  const arrow2 = useRef<ArrowHelper>(null);
  const ruler = useRef<Group>(null);
  const simulation = useRef<TwoBodySimulation | null>(null);
  const active = useRef(false);
  const illustrativeContactDistance = (radii[0] + radii[1]) / (positions[1] - positions[0]);
  const totalMass = experiment.mass1 + experiment.mass2;
  const centerOfMass =
    (experiment.mass1 * positions[0] + experiment.mass2 * positions[1]) / totalMass;
  const worldUnitsPerMeter = (positions[1] - positions[0]) / experiment.distance;
  const characteristicTime = Math.sqrt(
    experiment.distance ** 3 / (GRAVITATIONAL_CONSTANT * totalMass),
  );

  const applySimulationState = useCallback(
    (currentSimulation: TwoBodySimulation) => {
      const state = currentSimulation.state;
      const current = [
        centerOfMass + state.position1 * experiment.distance * worldUnitsPerMeter,
        centerOfMass + state.position2 * experiment.distance * worldUnitsPerMeter,
      ] as const;
      if (body1.current) body1.current.position.x = current[0];
      if (body2.current) body2.current.position.x = current[1];
      if (arrow1.current) arrow1.current.position.x = current[0];
      if (arrow2.current) arrow2.current.position.x = current[1];
      if (ruler.current) {
        ruler.current.position.x = (current[0] + current[1]) / 2;
        ruler.current.scale.x = state.distance;
      }
      const currentDistance = state.distance * experiment.distance;
      const currentForce = gravitationalForce(experiment.mass1, experiment.mass2, currentDistance);
      const currentArrowLength = forceLabLayout(
        { ...experiment, distance: currentDistance },
        currentForce,
      ).arrowLength;
      arrow1.current?.setLength(
        currentArrowLength,
        currentArrowLength * 0.28,
        currentArrowLength * 0.16,
      );
      arrow2.current?.setLength(
        currentArrowLength,
        currentArrowLength * 0.28,
        currentArrowLength * 0.16,
      );
    },
    [centerOfMass, experiment, worldUnitsPerMeter],
  );

  useLayoutEffect(() => {
    if (staticPull) {
      const stillSimulation = new TwoBodySimulation(
        [experiment.mass1, experiment.mass2],
        illustrativeContactDistance,
      );
      for (let frame = 0; frame < 300 && !stillSimulation.halted; frame++) {
        stillSimulation.advance(0.01);
      }
      simulation.current = stillSimulation;
      applySimulationState(stillSimulation);
      onAnimationComplete(stillSimulation.state.time * characteristicTime);
    } else if (!active.current) {
      const initialSimulation = new TwoBodySimulation(
        [experiment.mass1, experiment.mass2],
        illustrativeContactDistance,
      );
      simulation.current = initialSimulation;
      applySimulationState(initialSimulation);
    }
    invalidate();
  }, [
    applySimulationState,
    characteristicTime,
    experiment.mass1,
    experiment.mass2,
    illustrativeContactDistance,
    invalidate,
    onAnimationComplete,
    staticPull,
  ]);

  useEffect(() => {
    if (!animating || animationRun === 0 || staticPull) {
      active.current = false;
      return;
    }
    const nextSimulation = new TwoBodySimulation(
      [experiment.mass1, experiment.mass2],
      illustrativeContactDistance,
    );
    simulation.current = nextSimulation;
    active.current = true;
    applySimulationState(nextSimulation);
    invalidate();
  }, [
    animationRun,
    animating,
    applySimulationState,
    experiment.mass1,
    experiment.mass2,
    illustrativeContactDistance,
    invalidate,
    staticPull,
  ]);

  useEffect(() => {
    if (staticPull) active.current = false;
  }, [staticPull]);

  useFrame((_, delta) => {
    if (!active.current || !simulation.current) return;
    const currentSimulation = simulation.current;
    currentSimulation.advance(Math.min(delta, 0.05) * NORMALIZED_TIME_PER_SECOND);
    applySimulationState(currentSimulation);
    if (currentSimulation.halted) {
      active.current = false;
      onAnimationComplete(currentSimulation.state.time * characteristicTime);
    }
    invalidate();
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[-3, 4, 6]} intensity={2.2} />
      <gridHelper
        args={[10, 20, palette.gridCenter, palette.grid]}
        position={[0, RULER_OFFSET_Y - 0.4, 0]}
      />
      {positions.map((x, body) => (
        <group key={body} ref={body === 0 ? body1 : body2} position={[x, 0, 0]}>
          <mesh>
            <sphereGeometry args={[radii[body]!, 32, 24]} />
            <meshStandardMaterial
              color={palette.bodies[body]}
              emissive={palette.bodies[body]}
              emissiveIntensity={0.25}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}
      <ForceArrow
        arrowRef={arrow1}
        x={positions[0]}
        y={ARROW_OFFSET_Y}
        direction={RIGHT}
        length={arrowLength}
        color={palette.bodies[0]}
      />
      <ForceArrow
        arrowRef={arrow2}
        x={positions[1]}
        y={-ARROW_OFFSET_Y}
        direction={LEFT}
        length={arrowLength}
        color={palette.bodies[1]}
      />
      <group ref={ruler}>
        <DistanceRuler
          left={positions[0]}
          right={positions[1]}
          color={palette.ruler}
          y={RULER_OFFSET_Y}
        />
      </group>
      <CameraFit visibleHalfWidth={VISIBLE_HALF_WIDTH} fieldOfViewDegrees={FIELD_OF_VIEW_DEGREES} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping={false}
        minPolarAngle={POLAR_RANGE.min}
        maxPolarAngle={POLAR_RANGE.max}
      />
    </>
  );
}

export default function ForceLabScene(props: ForceLabSceneProps) {
  const { resolvedTheme } = useTheme();
  const palette = scenePalette(resolvedTheme === 'dark');
  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: FIELD_OF_VIEW_DEGREES }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          props.onContextLost();
        });
      }}
    >
      <ForceLabContents {...props} palette={palette} />
    </Canvas>
  );
}
