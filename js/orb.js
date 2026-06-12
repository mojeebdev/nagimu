/* NAGIMU — Orb class: physics, render, interaction */

import { ZODIACS, ELEMENT_PHYSICS } from './zodiac.js';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export class Orb {
  constructor(canvasWidth, canvasHeight, element, zodiac, entryEdge = null) {
    const physics = ELEMENT_PHYSICS[element];
    this.element = element;
    this.zodiac = zodiac;
    this.glyph = ZODIACS[zodiac].glyph;
    this.color = physics.color;
    this.radius = 22;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.opacity = 0;
    this.alive = true;
    this.converging = false;
    this.convergeTarget = null;
    this.convergeProgress = 0;

    if (entryEdge) {
      const margin = this.radius + 4;
      switch (entryEdge) {
        case 'left':
          this.x = -margin;
          this.y = Math.random() * canvasHeight;
          this.vx = physics.speed.max * 0.5;
          this.vy = (Math.random() - 0.5) * physics.speed.max;
          break;
        case 'right':
          this.x = canvasWidth + margin;
          this.y = Math.random() * canvasHeight;
          this.vx = -physics.speed.max * 0.5;
          this.vy = (Math.random() - 0.5) * physics.speed.max;
          break;
        case 'top':
          this.x = Math.random() * canvasWidth;
          this.y = -margin;
          this.vx = (Math.random() - 0.5) * physics.speed.max;
          this.vy = physics.speed.max * 0.5;
          break;
        default:
          this.x = Math.random() * canvasWidth;
          this.y = canvasHeight + margin;
          this.vx = (Math.random() - 0.5) * physics.speed.max;
          this.vy = -physics.speed.max * 0.5;
      }
    } else {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight;
      this.vx = (Math.random() - 0.5) * physics.speed.max;
      this.vy = (Math.random() - 0.5) * physics.speed.max;
    }
  }

  update(canvasWidth, canvasHeight, allOrbs, velocityScale = 1) {
    if (!this.alive) return;

    const physics = ELEMENT_PHYSICS[this.element];

    if (this.converging && this.convergeTarget) {
      const dx = this.convergeTarget.x - this.x;
      const dy = this.convergeTarget.y - this.y;
      this.x += dx * 0.18;
      this.y += dy * 0.18;
      this.convergeProgress += 1;
      return;
    }

    if (physics.wobble > 0) {
      this.vx += (Math.random() - 0.5) * physics.wobble;
      this.vy += (Math.random() - 0.5) * physics.wobble;
    }

    if (physics.pullStrength > 0) {
      for (const other of allOrbs) {
        if (other === this || !other.alive || other.element !== this.element) continue;
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 200) {
          this.vx += (dx / dist) * physics.pullStrength;
          this.vy += (dy / dist) * physics.pullStrength;
        }
      }
    }

    const maxSpeed = physics.speed.max * 1.5;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx * velocityScale;
    this.y += this.vy * velocityScale;
    this.wrap(canvasWidth, canvasHeight);

    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + 0.02);
    this.pulsePhase += 0.03;
  }

  wrap(canvasWidth, canvasHeight) {
    if (this.x < -this.radius) this.x = canvasWidth + this.radius;
    if (this.x > canvasWidth + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvasHeight + this.radius;
    if (this.y > canvasHeight + this.radius) this.y = -this.radius;
  }

  applyImpulse(touchX, touchY) {
    const dx = this.x - touchX;
    const dy = this.y - touchY;
    const dist = Math.hypot(dx, dy) || 1;
    const strength = 0.8;
    this.vx += (dx / dist) * strength;
    this.vy += (dy / dist) * strength;
  }

  dragToward(targetX, targetY) {
    this.x += (targetX - this.x) * 0.3;
    this.y += (targetY - this.y) * 0.3;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    const ringOpacity = 0.15 * Math.sin(this.pulsePhase);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(this.color, Math.max(0, ringOpacity));
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.color, 0.2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(this.color, 0.7);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "16px 'Vend', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = hexToRgba(this.color, 0.9);
    ctx.fillText(this.glyph, this.x, this.y);

    ctx.restore();
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

export function findNearestOrb(orbs, x, y, maxDist = 48) {
  let nearest = null;
  let minDist = maxDist;
  for (const orb of orbs) {
    if (!orb.alive) continue;
    const dist = Math.hypot(orb.x - x, orb.y - y);
    if (dist < minDist) {
      minDist = dist;
      nearest = orb;
    }
  }
  return nearest;
}

export const ENTRY_EDGES = ['left', 'right', 'top', 'bottom'];