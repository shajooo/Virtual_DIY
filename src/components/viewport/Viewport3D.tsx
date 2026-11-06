import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore, CameraPreset } from '../../store/viewportStore';
import { useSimulationStore } from '../../store/simulationStore';
import { buildGeometry } from '../../geometry/meshBuilder';
import { Part } from '../../types/part';
import { Joint, ScrewJoint } from '../../types/joint';
import {
  getCardboardTexture,
  getWoodTexture,
  getAcrylicTexture,
  getSteelTexture,
  get3DPrintTexture,
  getCustomTexture,
} from '../../utils/textureUtils';

// Camera controller responding to camera presets
function CameraController({
  preset,
  orbitEnabled,
}: {
  preset: CameraPreset;
  orbitEnabled: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isTapeActive = useSimulationStore((s) => s.isTapeActive);

  useEffect(() => {
    switch (preset) {
      case 'front':
        camera.position.set(0, 0, 160);
        camera.up.set(0, 1, 0);
        break;
      case 'top':
        camera.position.set(0, 160, 0.0001);
        camera.up.set(0, 0, -1);
        break;
      case 'right':
        camera.position.set(160, 0, 0);
        camera.up.set(0, 1, 0);
        break;
      case 'isometric':
      default:
        camera.position.set(100, 100, 100);
        camera.up.set(0, 1, 0);
        break;
    }
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [preset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      dampingFactor={0.1}
      enabled={orbitEnabled}
      mouseButtons={
        isTapeActive
          ? {
              LEFT: undefined,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.ROTATE,
            }
          : undefined
      }
    />
  );
}

// Child component for Ctrl + Scroll uniform scale handler
function WheelScaleHandler() {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const sel = useSelectionStore.getState();
      if (sel.selectedIds.length === 0) return;

      const factor = e.deltaY < 0 ? 1.05 : 0.95;
      // scaleGroupOrPart propagates to all group members automatically
      useProjectStore.getState().scaleGroupOrPart(sel.selectedIds[0], factor);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [gl]);

  return null;
}

// Stable View-Aligned Plane Projection for 1D mechanical slider dragging
function projectRayOntoAxisWithPlane(
  ray: THREE.Ray,
  axisOrigin: THREE.Vector3,
  axisDir: THREE.Vector3,
  camera: THREE.Camera
): number {
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);

  // Normal of plane containing axisDir and facing the camera
  let planeNormal = new THREE.Vector3().crossVectors(axisDir, camDir).cross(axisDir).normalize();
  if (planeNormal.lengthSq() < 0.01) {
    planeNormal.copy(camDir).negate();
  }

  const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, axisOrigin);
  const hit = new THREE.Vector3();
  if (ray.intersectPlane(dragPlane, hit)) {
    return hit.sub(axisOrigin).dot(axisDir);
  }

  // Skew line projection fallback
  const u = ray.direction;
  const v = axisDir;
  const w0 = new THREE.Vector3().subVectors(ray.origin, axisOrigin);
  const b = u.dot(v);
  const d = u.dot(w0);
  const e = v.dot(w0);
  const denom = 1.0 - b * b;
  if (Math.abs(denom) > 1e-4) {
    return (b * d - e) / denom;
  }
  return 0;
}

// Single Part Mesh Component with Drag-to-Move support
interface PartMeshProps {
  part: Part;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onInspect: (e: any) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  snapToGrid: boolean;
  gridSize: number;
  // All sibling IDs in the same group (empty when not grouped)
  groupSiblingIds: string[];
  meshGroupRefs: React.MutableRefObject<Map<string, THREE.Group>>;
  registerMeshGroup: (id: string, group: THREE.Group | null) => void;
}

const PartMesh: React.FC<PartMeshProps> = ({
  part,
  isSelected,
  onSelect,
  onInspect,
  setOrbitEnabled,
  snapToGrid,
  gridSize,
  groupSiblingIds,
  meshGroupRefs,
  registerMeshGroup,
}) => {
  const sketches = useProjectStore((s) => s.present.sketches);
  const moveGroupOrPart = useProjectStore((s) => s.moveGroupOrPart);
  const mode = useSelectionStore((s) => s.mode);

  const groupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragStartWorldRef = useRef(new THREE.Vector3()); // world-space hit point at drag start
  const partStartPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const currentDragDeltaRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const startRotationsRef = useRef<Map<string, THREE.Euler>>(new Map());
  const rodConstraintRef = useRef<{
    rodId: string;
    rodOrigin: THREE.Vector3;
    rodAxis: THREE.Vector3;
    minLimit: number;
    maxLimit: number;
    startS: number;
    isLeadScrew: boolean;
    pitch: number;
  } | null>(null);

  useEffect(() => {
    registerMeshGroup(part.id, groupRef.current);
    return () => registerMeshGroup(part.id, null);
  }, [part.id]);

  // Build individual geometry (strictly never merged)
  const geometry = useMemo(() => {
    return buildGeometry(part.params, sketches);
  }, [part.params, sketches]);

  // Wireframe geometry for highlight outline
  const wireGeometry = useMemo(() => {
    return new THREE.WireframeGeometry(geometry);
  }, [geometry]);

  // Procedural PBR Texture cache
  const texture = useMemo(() => {
    switch (part.material) {
      case 'cardboard': return getCardboardTexture();
      case 'wood':      return getWoodTexture();
      case 'acrylic':   return getAcrylicTexture();
      case 'steel':     return getSteelTexture();
      case '3dprint':   return get3DPrintTexture();
      case 'custom':    return part.color ? getCustomTexture(part.color) : null;
      default:          return null;
    }
  }, [part.material, part.color]);

  // Material appearance based on CAD material type
  const materialProps = useMemo(() => {
    const col =
      part.color ||
      (part.material === 'cardboard'
        ? '#c29b68'
        : part.material === 'wood'
        ? '#8b5a2b'
        : part.material === 'acrylic'
        ? '#3b82f6'
        : part.material === 'steel'
        ? '#8a9ba8'
        : part.material === '3dprint'
        ? '#e8e0d8'
        : '#aaaaaa');

    switch (part.material) {
      case 'cardboard':
        return { color: col, map: texture, roughness: 0.9, metalness: 0.0 };
      case 'wood':
        return { color: col, map: texture, roughness: 0.75, metalness: 0.0 };
      case 'acrylic':
        return {
          color: col,
          map: texture,
          roughness: 0.05,
          metalness: 0.05,
          transparent: true,
          opacity: 0.82,
        };
      case 'steel':
        return { color: col, map: texture, roughness: 0.25, metalness: 0.85 };
      case '3dprint':
        return { color: col, map: texture, roughness: 0.8, metalness: 0.02 };
      case 'custom':
      default:
        return { color: col, roughness: 0.5, metalness: 0.2 };
    }
  }, [part.material, part.color, texture]);

  const rotRad: [number, number, number] = [
    (part.transform.rotation.x * Math.PI) / 180,
    (part.transform.rotation.y * Math.PI) / 180,
    (part.transform.rotation.z * Math.PI) / 180,
  ];

  const pos: [number, number, number] = [
    part.transform.position.x,
    part.transform.position.y,
    part.transform.position.z,
  ];

  const scale: [number, number, number] = [
    part.transform.scale.x,
    part.transform.scale.y,
    part.transform.scale.z,
  ];

  // ── Drag-to-move with Group & Mechanical Slider Synchronization ─────────
  const { camera, gl } = useThree();

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    const isTapeActive = useSimulationStore.getState().isTapeActive;
    if (isTapeActive) return; // In tape mode, ignore part dragging

    if (mode !== 'select' && mode !== 'move') return;

    const isSimulating = useSimulationStore.getState().isSimulating;
    const allParts = useProjectStore.getState().present.parts;

    // Collect all affected parts (all parts in the group, or this part alone)
    const affectedIds = part.groupId
      ? allParts.filter((p) => p.groupId === part.groupId).map((p) => p.id)
      : [part.id];

    // Check if any part in affectedIds has a mechanical slider constraint
    const constrainedPart = allParts.find(
      (p) => affectedIds.includes(p.id) && p.mechanicalConstraint?.type === 'slider'
    );

    // In simulation mode: grounded parts cannot move at all!
    if (isSimulating && !constrainedPart) {
      return;
    }

    if (!isSelected) {
      useSelectionStore.getState().setSelected(affectedIds);
    }

    e.stopPropagation();
    isDraggingRef.current = true;
    setOrbitEnabled(false);

    // Record start positions and rotations of ALL parts in the project
    startPositionsRef.current.clear();
    startRotationsRef.current.clear();
    allParts.forEach((p) => {
      startPositionsRef.current.set(
        p.id,
        new THREE.Vector3(p.transform.position.x, p.transform.position.y, p.transform.position.z)
      );
      startRotationsRef.current.set(
        p.id,
        new THREE.Euler(
          (p.transform.rotation.x * Math.PI) / 180,
          (p.transform.rotation.y * Math.PI) / 180,
          (p.transform.rotation.z * Math.PI) / 180
        )
      );
    });

    currentDragDeltaRef.current.set(0, 0, 0);

    // Check if constrained to a rod
    let rodInfo: {
      rodId: string;
      rodOrigin: THREE.Vector3;
      rodAxis: THREE.Vector3;
      minLimit: number;
      maxLimit: number;
      startS: number;
      isLeadScrew: boolean;
      pitch: number;
    } | null = null;

    if (constrainedPart && constrainedPart.mechanicalConstraint) {
      const rod = allParts.find(
        (p) => p.id === constrainedPart.mechanicalConstraint?.targetPartId
      );
      if (rod) {
        const euler = new THREE.Euler(
          (rod.transform.rotation.x * Math.PI) / 180,
          (rod.transform.rotation.y * Math.PI) / 180,
          (rod.transform.rotation.z * Math.PI) / 180
        );
        const rodAxis = new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();
        const rodOrigin = new THREE.Vector3(
          rod.transform.position.x,
          rod.transform.position.y,
          rod.transform.position.z
        );

        const currentBearingPos = new THREE.Vector3(
          constrainedPart.transform.position.x,
          constrainedPart.transform.position.y,
          constrainedPart.transform.position.z
        );
        const currentS = currentBearingPos.clone().sub(rodOrigin).dot(rodAxis);

        const minL = constrainedPart.mechanicalConstraint.minLimit ?? -100;
        const maxL = constrainedPart.mechanicalConstraint.maxLimit ?? 100;

        rodInfo = {
          rodId: rod.id,
          rodOrigin,
          rodAxis,
          minLimit: minL,
          maxLimit: maxL,
          startS: currentS,
          isLeadScrew: rod.params.type === 'lead-screw',
          pitch: rod.params.type === 'lead-screw' ? rod.params.pitch || 2 : 2,
        };
      }
    }

    // Free drag plane setup
    const freeDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -part.transform.position.y);
    const startHit = new THREE.Vector3();
    if (!e.ray.intersectPlane(freeDragPlane, startHit)) {
      startHit.set(
        part.transform.position.x,
        part.transform.position.y,
        part.transform.position.z
      );
    }

    // Window-level tracking guarantees zero dropped frames and buttery smooth 60 FPS physics
    const onWindowPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      const ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(camera.matrixWorld);
      ray.direction.set(ndcX, ndcY, 0.5).unproject(camera).sub(ray.origin).normalize();

      let deltaVec = new THREE.Vector3();

      if (rodInfo) {
        const { rodOrigin, rodAxis, minLimit, maxLimit, startS, isLeadScrew, pitch, rodId } =
          rodInfo;

        // Stable view-aligned plane projection
        const sRaw = projectRayOntoAxisWithPlane(ray, rodOrigin, rodAxis, camera);
        const sClamped = Math.max(minLimit, Math.min(maxLimit, sRaw));
        const deltaS = sClamped - startS;

        deltaVec = rodAxis.clone().multiplyScalar(deltaS);

        // Rotate lead screw proportionally to linear displacement
        if (isLeadScrew) {
          const screwGrp = meshGroupRefs.current.get(rodId);
          const startRot = startRotationsRef.current.get(rodId);
          if (screwGrp && startRot) {
            const rotRad = (deltaS / pitch) * Math.PI * 2;
            screwGrp.rotation.y = startRot.y + rotRad;
          }

          // Rotate aligned coupling in sync
          allParts.forEach((item) => {
            if (item.params.type === 'coupling') {
              const grp = meshGroupRefs.current.get(item.id);
              const sRot = startRotationsRef.current.get(item.id);
              if (grp && sRot) {
                const rotRad = (deltaS / pitch) * Math.PI * 2;
                grp.rotation.y = sRot.y + rotRad;
              }
            }
          });
        }
      } else {
        // Free horizontal plane dragging
        const hit = new THREE.Vector3();
        if (ray.intersectPlane(freeDragPlane, hit)) {
          let dx = hit.x - startHit.x;
          let dz = hit.z - startHit.z;
          if (snapToGrid) {
            dx = Math.round(dx / gridSize) * gridSize;
            dz = Math.round(dz / gridSize) * gridSize;
          }
          deltaVec.set(dx, 0, dz);
        }
      }

      // Visual transform of all group members at 60 FPS
      affectedIds.forEach((id) => {
        const grp = meshGroupRefs.current.get(id);
        const startPos = startPositionsRef.current.get(id);
        if (grp && startPos) {
          grp.position.set(
            startPos.x + deltaVec.x,
            startPos.y + deltaVec.y,
            startPos.z + deltaVec.z
          );
        }
      });

      currentDragDeltaRef.current.copy(deltaVec);
    };

    const onWindowPointerUp = () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      isDraggingRef.current = false;
      setOrbitEnabled(true);

      const deltaVec = currentDragDeltaRef.current;
      if (deltaVec.lengthSq() > 0.0001) {
        moveGroupOrPart(part.id, deltaVec.x, deltaVec.y, deltaVec.z);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
  };

  return (
    <group ref={groupRef} position={pos} rotation={rotRad} scale={scale}>
      <mesh
        geometry={geometry}
        userData={{ isCadPart: true, partId: part.id }}
        onClick={onSelect}
        onDoubleClick={onInspect}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Selected Outline / Wireframe */}
      {isSelected && (
        <lineSegments geometry={wireGeometry}>
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};

// Joint Marker Component
interface JointMarkerProps {
  joint: Joint;
}

const JointMarker: React.FC<JointMarkerProps> = ({ joint }) => {
  const { anchorPosition, type } = joint;

  // Groups don't need physical fastener markers in the 3D scene
  if (type === 'group') {
    return null;
  }

  if (type === 'glue') {
    return (
      <group position={[anchorPosition.x, anchorPosition.y, anchorPosition.z]}>
        <mesh>
          <cylinderGeometry args={[6, 6, 1.2, 32]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (type === 'screw') {
    const screwJoint = joint as ScrewJoint;
    const count = screwJoint.screwCount || 1;
    const dia = screwJoint.screwDiameter || 3;

    return (
      <group position={[anchorPosition.x, anchorPosition.y, anchorPosition.z]}>
        {Array.from({ length: count }).map((_, idx) => {
          const offsetX = (idx - (count - 1) / 2) * (dia * 2.5);
          return (
            <group key={idx} position={[offsetX, 0, 0]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[dia / 2, dia / 2, 6, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 6, 0]}>
                <cylinderGeometry args={[dia, dia, 1, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Tape Measure Tool in 3D Viewport with Edge/Vertex Magnetic Snapping
// ─────────────────────────────────────────────────────────────────────────────
const TapeMeasureTool: React.FC = () => {
  const isTapeActive = useSimulationStore((s) => s.isTapeActive);
  const tapeStart = useSimulationStore((s) => s.tapeStart);
  const tapeEnd = useSimulationStore((s) => s.tapeEnd);
  const tapeHover = useSimulationStore((s) => s.tapeHover);
  const setTapeStart = useSimulationStore((s) => s.setTapeStart);
  const setTapeEnd = useSimulationStore((s) => s.setTapeEnd);
  const setTapeHover = useSimulationStore((s) => s.setTapeHover);

  const { camera, gl, scene, raycaster } = useThree();
  const [cursorSnap, setCursorSnap] = useState<THREE.Vector3 | null>(null);
  const [snappedToEdge, setSnappedToEdge] = useState(false);
  const cursorSnapRef = useRef<THREE.Vector3 | null>(null);

  // Magnetic edge / vertex snap helper
  const snapToNearestGeometryEdgeOrVertex = (
    hit: THREE.Intersection
  ): { point: THREE.Vector3; isEdge: boolean } => {
    const raw = hit.point.clone();
    if (!hit.object || !(hit.object as THREE.Mesh).isMesh) {
      return { point: raw, isEdge: false };
    }

    const mesh = hit.object as THREE.Mesh;
    const geom = mesh.geometry;
    if (!geom || !geom.attributes.position) {
      return { point: raw, isEdge: false };
    }

    const pos = geom.attributes.position;
    const mat = mesh.matrixWorld;
    let closest = raw.clone();
    let minDistSq = 25 * 25; // 25mm magnetic snap distance
    let found = false;

    if (hit.face) {
      const vA = new THREE.Vector3().fromBufferAttribute(pos, hit.face.a).applyMatrix4(mat);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, hit.face.b).applyMatrix4(mat);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, hit.face.c).applyMatrix4(mat);

      // Vertex snap
      [vA, vB, vC].forEach((v) => {
        const dSq = v.distanceToSquared(raw);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closest.copy(v);
          found = true;
        }
      });

      // Edge segments snap
      const testSeg = (p1: THREE.Vector3, p2: THREE.Vector3) => {
        const seg = new THREE.Line3(p1, p2);
        const pt = new THREE.Vector3();
        seg.closestPointToPoint(raw, true, pt);
        const dSq = pt.distanceToSquared(raw);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closest.copy(pt);
          found = true;
        }
      };

      testSeg(vA, vB);
      testSeg(vB, vC);
      testSeg(vC, vA);
    }

    return { point: found ? closest : raw, isEdge: found };
  };

  useEffect(() => {
    if (!isTapeActive) {
      setCursorSnap(null);
      cursorSnapRef.current = null;
      return;
    }

    const el = gl.domElement;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      // Collect all CAD part meshes
      const meshes: THREE.Mesh[] = [];
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh && obj.visible && (obj as any).userData?.isCadPart) {
          meshes.push(obj as THREE.Mesh);
        }
      });

      let hitPt: THREE.Vector3 | null = null;
      let isEdge = false;

      if (meshes.length > 0) {
        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length > 0) {
          const res = snapToNearestGeometryEdgeOrVertex(hits[0]);
          hitPt = res.point;
          isEdge = res.isEdge;
        }
      }

      if (!hitPt) {
        // Fallback to ground plane (y = 0)
        const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const pt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(ground, pt)) {
          hitPt = pt;
        }
      }

      if (hitPt) {
        setCursorSnap(hitPt);
        setSnappedToEdge(isEdge);
        cursorSnapRef.current = hitPt;
        const curStart = useSimulationStore.getState().tapeStart;
        const curEnd = useSimulationStore.getState().tapeEnd;
        if (curStart && !curEnd) {
          setTapeHover({ x: hitPt.x, y: hitPt.y, z: hitPt.z });
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const pt = cursorSnapRef.current;
      if (!pt) return;

      e.preventDefault();
      e.stopPropagation();

      const curStart = useSimulationStore.getState().tapeStart;
      const curEnd = useSimulationStore.getState().tapeEnd;

      if (!curStart || curEnd) {
        // Start new measurement
        setTapeStart({ x: pt.x, y: pt.y, z: pt.z });
      } else {
        // Complete measurement
        setTapeEnd({ x: pt.x, y: pt.y, z: pt.z });
      }
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerdown', handlePointerDown);
    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isTapeActive, camera, gl, scene, raycaster]);

  if (!isTapeActive) return null;

  const activeEnd = tapeEnd || tapeHover;
  const pStart = tapeStart ? new THREE.Vector3(tapeStart.x, tapeStart.y, tapeStart.z) : null;
  const pEnd = activeEnd ? new THREE.Vector3(activeEnd.x, activeEnd.y, activeEnd.z) : null;

  const lineGeom = useMemo(() => {
    if (!pStart || !pEnd) return null;
    return new THREE.BufferGeometry().setFromPoints([pStart, pEnd]);
  }, [pStart, pEnd]);

  const lineObject = useMemo(() => {
    if (!lineGeom) return null;
    const mat = new THREE.LineBasicMaterial({
      color: '#f59e0b',
      linewidth: 3,
      depthTest: false,
    });
    const line = new THREE.Line(lineGeom, mat);
    line.renderOrder = 999;
    return line;
  }, [lineGeom]);

  const liveDistance = pStart && pEnd ? pStart.distanceTo(pEnd) : null;
  const midpoint = pStart && pEnd ? pStart.clone().add(pEnd).multiplyScalar(0.5) : null;

  return (
    <group name="tapeHelper">
      {/* Magnetic snap crosshair cursor */}
      {cursorSnap && (
        <group position={cursorSnap}>
          <mesh>
            <sphereGeometry args={[snappedToEdge ? 2.6 : 1.8, 16, 16]} />
            <meshBasicMaterial color={snappedToEdge ? '#06b6d4' : '#f59e0b'} depthTest={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 3.8, 24]} />
            <meshBasicMaterial
              color={snappedToEdge ? '#06b6d4' : '#38bdf8'}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
        </group>
      )}

      {/* Start Point Marker */}
      {pStart && (
        <mesh position={pStart}>
          <sphereGeometry args={[2.8, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
      )}

      {/* End Point Marker */}
      {pEnd && (
        <mesh position={pEnd}>
          <sphereGeometry args={[2.8, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
      )}

      {/* Dimension Line */}
      {lineObject && <primitive object={lineObject} />}

      {/* 3D Floating Measurement Badge */}
      {midpoint && liveDistance !== null && (
        <Html position={[midpoint.x, midpoint.y + 6, midpoint.z]} center distanceFactor={140}>
          <div className="bg-[#111827]/95 border border-amber-400 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md shadow-2xl pointer-events-none select-none flex items-center gap-1.5 whitespace-nowrap">
            <svg
              className="w-3.5 h-3.5 text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 12h20M7 8v8M12 9v6M17 8v8" />
            </svg>
            <span>{liveDistance.toFixed(2)} mm</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Real-time Mechanical Physics Engine for Automated Simulation
// ─────────────────────────────────────────────────────────────────────────────
function PhysicsEngine({
  meshGroupRefs,
}: {
  meshGroupRefs: React.MutableRefObject<Map<string, THREE.Group>>;
}) {
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const motorRunning = useSimulationStore((s) => s.motorRunning);
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);
  const present = useProjectStore((s) => s.present);
  const motorDirRef = useRef(1);

  useFrame((_, delta) => {
    if (!isSimulating || !motorRunning) return;

    const dt = Math.min(delta, 0.05) * simulationSpeed;
    const speedMmPerSec = 40; // 40 mm/sec mechanical traverse rate

    present.parts.forEach((part) => {
      if (part.mechanicalConstraint?.type === 'slider') {
        const rod = present.parts.find(
          (p) => p.id === part.mechanicalConstraint?.targetPartId
        );
        if (!rod) return;

        const minL = part.mechanicalConstraint.minLimit ?? -100;
        const maxL = part.mechanicalConstraint.maxLimit ?? 100;
        const range = maxL - minL;
        if (range <= 0.1) return;

        let currentPos = part.mechanicalConstraint.currentPos ?? 0;
        currentPos += motorDirRef.current * speedMmPerSec * dt;

        if (currentPos >= maxL) {
          currentPos = maxL;
          motorDirRef.current = -1;
        } else if (currentPos <= minL) {
          currentPos = minL;
          motorDirRef.current = 1;
        }
        part.mechanicalConstraint.currentPos = currentPos;

        const euler = new THREE.Euler(
          (rod.transform.rotation.x * Math.PI) / 180,
          (rod.transform.rotation.y * Math.PI) / 180,
          (rod.transform.rotation.z * Math.PI) / 180
        );
        const rodAxis = new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();
        const movement = rodAxis.clone().multiplyScalar(currentPos);

        const affectedIds = part.groupId
          ? present.parts.filter((p) => p.groupId === part.groupId).map((p) => p.id)
          : [part.id];

        affectedIds.forEach((id) => {
          const grp = meshGroupRefs.current.get(id);
          const p = present.parts.find((item) => item.id === id);
          if (grp && p) {
            grp.position.set(
              p.transform.position.x + movement.x,
              p.transform.position.y + movement.y,
              p.transform.position.z + movement.z
            );
          }
        });

        // Rotate lead screw
        if (rod.params.type === 'lead-screw') {
          const pitch = rod.params.pitch || 2;
          const rotDeg = (currentPos / pitch) * 360;
          const screwGrp = meshGroupRefs.current.get(rod.id);
          if (screwGrp) {
            screwGrp.rotation.y = THREE.MathUtils.degToRad(
              rod.transform.rotation.y + rotDeg
            );
          }
          present.parts.forEach((cp) => {
            if (cp.params.type === 'coupling') {
              const cGrp = meshGroupRefs.current.get(cp.id);
              if (cGrp) {
                cGrp.rotation.y = THREE.MathUtils.degToRad(
                  cp.transform.rotation.y + rotDeg
                );
              }
            }
          });
        }
      }
    });
  });

  return null;
}

export const Viewport3D: React.FC = () => {
  const present = useProjectStore((s) => s.present);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const setInspected = useSelectionStore((s) => s.setInspected);
  const mode = useSelectionStore((s) => s.mode);
  const setMode = useSelectionStore((s) => s.setMode);
  const joinComponentAId = useSelectionStore((s) => s.joinComponentAId);
  const setJoinComponentAId = useSelectionStore((s) => s.setJoinComponentAId);

  const isTapeActive = useSimulationStore((s) => s.isTapeActive);
  const setTapeActive = useSimulationStore((s) => s.setTapeActive);
  const tapeDistance = useSimulationStore((s) => s.tapeDistance);
  const tapeStart = useSimulationStore((s) => s.tapeStart);
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const motorRunning = useSimulationStore((s) => s.motorRunning);
  const toggleMotor = useSimulationStore((s) => s.toggleMotor);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);

  const cameraPreset = useViewportStore((s) => s.cameraPreset);
  const showGrid = useViewportStore((s) => s.showGrid);
  const showAxes = useViewportStore((s) => s.showAxes);
  const gridSize = useViewportStore((s) => s.gridSize);
  const snapToGrid = useViewportStore((s) => s.snapToGrid);

  const [orbitEnabled, setOrbitEnabled] = useState(true);

  const meshGroupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const registerMeshGroup = (id: string, group: THREE.Group | null) => {
    if (group) {
      meshGroupRefs.current.set(id, group);
    } else {
      meshGroupRefs.current.delete(id);
    }
  };

  const handlePartClick = (e: any, partId: string) => {
    e.stopPropagation();

    // In tape measure mode, let tape handler receive clicks
    if (isTapeActive) {
      return;
    }

    // Handling joint picking workflow
    if (mode === 'join-pick-a') {
      setJoinComponentAId(partId);
      setMode('join-pick-b');
      setSelected([partId]);
      return;
    }

    if (mode === 'join-pick-b' && joinComponentAId) {
      if (joinComponentAId === partId) {
        alert('Please pick a different part for Component B.');
        return;
      }
      window.dispatchEvent(
        new CustomEvent('cardboardcad:open-joint', {
          detail: { componentAId: joinComponentAId, componentBId: partId },
        })
      );
      setMode('select');
      setJoinComponentAId(null);
      return;
    }

    // Single click: Group selection behavior
    const clickedPart = present.parts.find((p) => p.id === partId);
    let targetIds = [partId];
    if (clickedPart?.groupId) {
      // Select all parts with the same groupId
      targetIds = present.parts
        .filter((p) => p.groupId === clickedPart.groupId)
        .map((p) => p.id);
    }

    if (e.shiftKey) {
      const allSelected = targetIds.every((id) => selectedIds.includes(id));
      if (allSelected) {
        setSelected(selectedIds.filter((id) => !targetIds.includes(id)));
      } else {
        const set = new Set([...selectedIds, ...targetIds]);
        setSelected(Array.from(set));
      }
    } else {
      setSelected(targetIds);
    }
  };

  const handlePartInspect = (e: any, partId: string) => {
    e.stopPropagation();
    // Double click enters the group: select ONLY that individual part
    setSelected([partId]);
    setInspected(partId);
  };

  const handleCanvasClick = () => {
    if (mode.startsWith('join')) {
      setMode('select');
      setJoinComponentAId(null);
    } else {
      setSelected([]);
      setInspected(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#161616] select-none">
      <Canvas
        shadows
        camera={{ position: [100, 100, 100], fov: 45, near: 1, far: 2000 }}
        onPointerMissed={handleCanvasClick}
      >
        {/* Camera Preset Handler + OrbitControls */}
        <CameraController preset={cameraPreset} orbitEnabled={orbitEnabled} />

        {/* Ctrl+Scroll Scale Handler */}
        <WheelScaleHandler />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[100, 150, 100]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-100, 80, -100]} intensity={0.4} />

        {/* CAD Grid */}
        {showGrid && (
          <Grid
            renderOrder={-1}
            position={[0, -0.01, 0]}
            infiniteGrid
            cellSize={gridSize}
            sectionSize={gridSize * 5}
            sectionColor="#404040"
            cellColor="#242424"
            fadeDistance={400}
            fadeStrength={1.5}
          />
        )}

        {/* Axes Helper */}
        {showAxes && <primitive object={new THREE.AxesHelper(30)} position={[0, 0, 0]} />}

        {/* Render Visible Parts (never merged) */}
        {present.parts
          .filter((p) => p.visible)
          .map((part) => {
            // Pre-compute sibling IDs for this part's group (empty when ungrouped)
            const groupSiblingIds: string[] = part.groupId
              ? present.parts
                  .filter((p2) => p2.groupId === part.groupId && p2.id !== part.id)
                  .map((p2) => p2.id)
              : [];

            return (
              <PartMesh
                key={part.id}
                part={part}
                isSelected={selectedIds.includes(part.id)}
                onSelect={(e) => handlePartClick(e, part.id)}
                onInspect={(e) => handlePartInspect(e, part.id)}
                setOrbitEnabled={setOrbitEnabled}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                groupSiblingIds={groupSiblingIds}
                meshGroupRefs={meshGroupRefs}
                registerMeshGroup={registerMeshGroup}
              />
            );
          })}

        {/* Render Visible Joints */}
        {present.joints
          .filter((j) => j.visible)
          .map((joint) => (
            <JointMarker key={joint.id} joint={joint} />
          ))}

        {/* Real-time Mechanical Physics Engine */}
        <PhysicsEngine meshGroupRefs={meshGroupRefs} />

        {/* Tape Measurement Tool (Edge snapping & visual lines) */}
        <TapeMeasureTool />
      </Canvas>

      {/* Floating HUD Overlays - Centered at bottom-6 in a vertical stack to prevent any UI overlaps */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none [&>*]:pointer-events-auto select-none">
        {/* Floating Instructions when picking components for Joint */}
        {mode.startsWith('join') && (
          <div className="bg-amber-500 text-black font-semibold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
            <span>
              {mode === 'join-pick-a'
                ? 'Click the FIRST part (Component A) to connect'
                : 'Click the SECOND part (Component B) to connect'}
            </span>
            <button
              onClick={() => setMode('select')}
              className="bg-black/20 hover:bg-black/30 text-black px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors"
            >
              Esc to cancel
            </button>
          </div>
        )}

        {/* Floating Tape Measure Callout */}
        {isTapeActive && (
          <div className="bg-[#1e293b]/95 backdrop-blur border border-amber-500/60 text-white font-medium text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M7 8v8M12 9v6M17 8v8" />
              </svg>
              <span className="font-semibold">Tape Measure</span>
            </div>

            <div className="h-3.5 w-[1px] bg-gray-600" />

            {tapeDistance !== null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-300">Exact Distance:</span>
                <span className="font-mono font-bold text-amber-300 text-sm bg-black/40 px-2 py-0.5 rounded">
                  {tapeDistance.toFixed(2)} mm
                </span>
              </div>
            ) : tapeStart ? (
              <span className="text-amber-200">
                Click second point/edge to measure • Edge snap active
              </span>
            ) : (
              <span className="text-gray-300">
                Click any point or edge on an object to start • Edge snap active
              </span>
            )}

            <div className="h-3.5 w-[1px] bg-gray-600" />

            <button
              onClick={() => setTapeActive(false)}
              className="bg-black/40 hover:bg-black/70 text-gray-300 hover:text-white px-2 py-0.5 rounded text-[11px] font-mono uppercase transition-colors"
            >
              Esc to Exit
            </button>
          </div>
        )}

        {/* Floating Simulation Active Pill */}
        {isSimulating && (
          <div className="bg-emerald-950/95 backdrop-blur border border-emerald-500/60 text-white font-medium text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              <span>Mechanical Physics Active</span>
            </div>

            <div className="h-3.5 w-[1px] bg-emerald-700/60" />

            <button
              onClick={toggleMotor}
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 font-semibold ${
                motorRunning
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              {motorRunning ? '⏸ Pause Motor' : '▶ Run Motor'}
            </button>

            <span className="text-emerald-200 text-[11px]">
              {motorRunning
                ? 'Motor driving lead screw & linear rails'
                : 'Drag carriage along rod • Grounded parts locked'}
            </span>

            <div className="h-3.5 w-[1px] bg-emerald-700/60" />

            <button
              onClick={stopSimulation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors"
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
