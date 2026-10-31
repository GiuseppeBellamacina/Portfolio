/** 2D flight of the thrown mascot inside the viewport (px, px/s, radians). */

export interface Body {
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	spin: number;
}

export interface Bounds {
	width: number;
	height: number;
	radius: number;
	/** Ceiling (e.g. below the navbar) */
	top: number;
}

const GRAVITY = 2200;
const RESTITUTION = 0.72;
const AIR_DRAG = 0.35;
const FLOOR_FRICTION = 0.82;
const SPIN_DECAY = 1.6;

/** Advances the body one step; returns the strongest wall impact speed (px/s), 0 if none. */
export function step(b: Body, dt: number, bounds: Bounds): number {
	const { width, height, radius: r, top } = bounds;
	b.vy += GRAVITY * dt;
	const drag = Math.exp(-AIR_DRAG * dt);
	b.vx *= drag;
	b.vy *= drag;
	b.x += b.vx * dt;
	b.y += b.vy * dt;

	let impact = 0;
	if (b.x < r || b.x > width - r) {
		impact = Math.max(impact, Math.abs(b.vx));
		b.x = b.x < r ? r : width - r;
		b.vx = -b.vx * RESTITUTION;
		b.spin = -b.spin * 0.6 + (b.vy / r) * 0.3;
	}
	if (b.y < top + r) {
		impact = Math.max(impact, Math.abs(b.vy));
		b.y = top + r;
		b.vy = -b.vy * RESTITUTION;
	}
	if (b.y > height - r) {
		impact = Math.max(impact, Math.abs(b.vy));
		b.y = height - r;
		b.vy = -b.vy * RESTITUTION;
		b.vx *= FLOOR_FRICTION;
		b.spin = b.vx / r; // rolls along the floor
	}
	b.angle += b.spin * dt;
	b.spin *= Math.exp(-SPIN_DECAY * dt);
	return impact;
}

/** On the floor and nearly still */
export function isResting(b: Body, bounds: Bounds): boolean {
	return b.y >= bounds.height - bounds.radius - 1 && Math.abs(b.vy) < 80 && Math.abs(b.vx) < 30;
}
