/**
 * Types for actors.js, for TypeScript projects (the website imports the kit).
 * Loose on purpose: builders return three.js objects plus a few handles.
 */
import type * as THREE from "three";

export declare const PALETTE: Record<string, string>;

export interface Blob {
  group: THREE.Group;
  body: THREE.Mesh;
  face: THREE.Group;
  top: number;
  sxz: number;
}

export interface BlobOptions {
  color?: string;
  cheek?: string;
  squash?: number;
  open?: number;
  eyes?: number;
  happy?: boolean;
  mouth?: number;
  blush?: number;
  tilt?: number;
}

export interface Kit {
  THREE: typeof THREE;
  PALETTE: Record<string, string>;
  toon(color: string, extra?: Record<string, unknown>): THREE.MeshToonMaterial;
  blob(options?: BlobOptions): Blob;
  cap(b: Blob, color?: string): Blob;
  glasses(b: Blob, color?: string): Blob;
  hairBun(b: Blob, color?: string, tie?: string): Blob;
  bow(b: Blob, color?: string): Blob;
  sprout(b: Blob, sway?: number): Blob;
  curl(b: Blob, color?: string): Blob;
  pacifier(b: Blob, color?: string): Blob;
  dog(options?: { color?: string; ear?: string; wag?: number; ears?: number; open?: number }): { group: THREE.Group; top: number; mouth: THREE.Vector3 };
  [builder: string]: unknown;
}

export declare function createKit(three: typeof THREE): Kit;
