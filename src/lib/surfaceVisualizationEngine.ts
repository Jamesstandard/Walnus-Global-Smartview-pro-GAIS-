/**
 * SmartView Pro™ - Surface Selection & Coating Visualisation Engine
 * Walnus Global Ventures
 * Milestone: SV-006
 */

export type SelectionMethod = 'manual' | 'polygon' | 'ai';

export interface SurfaceSelectionRegion {
  id: string;
  name: string;
  method: SelectionMethod;
  points: { x: number; y: number }[];
  colorHex: string;
  finishType: 'Matte' | 'Satin' | 'Gloss' | 'Elastomeric';
  timestamp: number;
}

export interface VisualizationProject {
  captureId: string;
  originalImageSrc: string;
  regions: SurfaceSelectionRegion[];
  activeMethod: SelectionMethod;
  brushRadius: number;
  lastUpdated: number;
}

export const WALNUS_EXTERIOR_PALETTE = [
  { name: 'Cerulean Sky', hex: '#3b82f6', category: 'Architectural Blue' },
  { name: 'Alpine White', hex: '#f8fafc', category: 'Neutral Base' },
  { name: 'Graphite Slate', hex: '#1e293b', category: 'Dark Accent' },
  { name: 'Desert Sand', hex: '#d97706', category: 'Earthy Tone' },
  { name: 'Forest Moss', hex: '#15803d', category: 'Botanical' },
  { name: 'Crimson Brick', hex: '#b91c1c', category: 'Terracotta' },
  { name: 'Titanium Grey', hex: '#64748b', category: 'Industrial' },
  { name: 'Warm Beige', hex: '#b45309', category: 'Subtle Earth' },
];

export function createDefaultVisualizationProject(captureId: string, imageSrc: string): VisualizationProject {
  return {
    captureId,
    originalImageSrc: imageSrc,
    regions: [
      {
        id: 'reg_default_facade',
        name: 'Main Wall Section',
        method: 'manual',
        points: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 300 },
          { x: 100, y: 300 },
        ],
        colorHex: '#3b82f6',
        finishType: 'Satin',
        timestamp: Date.now(),
      },
    ],
    activeMethod: 'manual',
    brushRadius: 40,
    lastUpdated: Date.now(),
  };
}
