/**
 * TypeScript type definitions for Python Layout objects
 */

export type LayoutValue = number | LayoutValue[];

export interface ParsedLayout {
  shape: LayoutValue;
  stride: LayoutValue;
}

export interface CompositionResult {
  shape: LayoutValue;
  stride: LayoutValue;
}

