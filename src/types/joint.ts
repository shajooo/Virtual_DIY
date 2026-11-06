import { Vec3 } from './geometry';

export type JointType = 'glue' | 'screw' | 'group' | 'bolt' | 'tape' | 'hinge' | 'tab-slot' | 'mechanical-slider';

export interface JointBase {
  id: string;
  name?: string;
  type: JointType;
  componentAId: string;
  componentBId: string;
  anchorPosition: Vec3;
  visible: boolean;
}

export interface GlueJoint extends JointBase {
  type: 'glue';
}

export interface ScrewJoint extends JointBase {
  type: 'screw';
  screwCount: number;
  screwDiameter: number; // mm
}

export interface GroupJoint extends JointBase {
  type: 'group';
  memberIds: string[]; // all part IDs in the group (includes componentAId and componentBId for compat)
}

export interface MechanicalSliderJoint extends JointBase {
  type: 'mechanical-slider';
  axis: 'x' | 'y' | 'z';
  minLimit: number;
  maxLimit: number;
}

export type Joint = GlueJoint | ScrewJoint | GroupJoint | MechanicalSliderJoint;
