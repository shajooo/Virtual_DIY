import { UnitSystem } from './geometry';
import { Sketch } from './sketch';
import { Part } from './part';
import { Assembly } from './assembly';
import { Joint } from './joint';

export interface ProjectMeta {
  name: string;
  version: string; // e.g. "1.0"
  createdAt: string;
  modifiedAt: string;
  units: UnitSystem;
}

export interface Project {
  meta: ProjectMeta;
  sketches: Sketch[];
  parts: Part[];
  assemblies: Assembly[];
  joints: Joint[];
}
