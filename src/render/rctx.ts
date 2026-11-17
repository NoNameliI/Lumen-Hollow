import type { GameState, Quality, ViewState } from '../types';
import type { BiomeLook } from './palette';
import type { LightList } from './lights';

/** Tunables per quality preset. */
export interface QualityParams {
  name: Quality;
  lightScale: number; // resolution of the light buffers relative to the world
  bloom: boolean;
  fogLayers: number; // 1..3
  grain: boolean;
  particleCap: number;
  smoke: boolean; // enemy smoke trails
  maxLights: number;
}

export const QUALITY: Record<Quality, QualityParams> = {
  low: { name: 'low', lightScale: 0.25, bloom: false, fogLayers: 1, grain: false, particleCap: 300, smoke: false, maxLights: 48 },
  medium: { name: 'medium', lightScale: 0.5, bloom: true, fogLayers: 2, grain: false, particleCap: 600, smoke: true, maxLights: 96 },
  high: { name: 'high', lightScale: 0.5, bloom: true, fogLayers: 3, grain: true, particleCap: 900, smoke: true, maxLights: 160 },
};

/*
 * Module contract (see docs/ART_DIRECTION.md, "Render layers"). Each frame the orchestrator calls,
 * in this order:
 *   ground cache -> ground.drawGroundLive -> projectiles.drawZones -> fx.drawDecals
 *   shadows: tree.drawShadow, drawTowerShadow(t), drawEnemyShadow(e)
 *   enemies.drawEnemyTrails
 *   y-sorted bodies: drawTowerBody(t), drawEnemyBody(e) (ground units), tree.drawBody
 *   flying enemies: drawEnemyBody(e); projectiles.drawProjectileBodies; fx.drawWorld; overlays.drawDarkVortex
 *   edges.draw (map frame) ; fx.addLights
 *   LIGHTING (darkness + coloured light)  -> FOG
 *   emissive, 'lighter' blend: drawTowerGlow(t), drawEnemyGlow(e), drawProjectileGlow, drawZoneGlow,
 *     tree.drawGlow, fx.drawGlow
 *   BLOOM -> GRADE / VIGNETTE / GRAIN
 *   readable overlays (unaffected by lighting): overlays.*, drawEnemyBars(e), fx.drawText
 *   fx.drawScreen (screen-space flashes)
 * Body passes may register lights with f.lights.add(); they are applied in the LIGHTING step.
 * Glow passes run with globalCompositeOperation = 'lighter' already set; restore anything else you change.
 */

/**
 * Everything a draw module needs for one frame. Coordinates passed to draw calls are world
 * pixels (1280 x 720 logical); use toPx/toPy from core/constants for simulation cells.
 */
export interface FrameCtx {
  c: CanvasRenderingContext2D;
  state: GameState;
  view: ViewState;
  look: BiomeLook;
  q: QualityParams;
  time: number; // real seconds since the renderer started (animation clock)
  dt: number; // real seconds since the previous frame
  motion: number; // 1 normally, 0 with reduced motion: scale wobble, sway and shake by it
  lights: LightList;
}
