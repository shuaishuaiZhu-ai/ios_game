export interface Vector2 {
  x: number;
  y: number;
}

export interface ArenaRect {
  origin: Vector2;
  size: Vector2;
}

export const zeroVector = Object.freeze({ x: 0, y: 0 });

export function vec(x: number, y: number): Vector2 {
  return { x, y };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vector2, value: number): Vector2 {
  return { x: a.x * value, y: a.y * value };
}

export function length(a: Vector2): number {
  return Math.hypot(a.x, a.y);
}

export function normalize(a: Vector2): Vector2 {
  const value = length(a);
  if (value <= 0.0001) {
    return { ...zeroVector };
  }
  return { x: a.x / value, y: a.y / value };
}

export function distance(a: Vector2, b: Vector2): number {
  return length(sub(a, b));
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function rect(x: number, y: number, width: number, height: number): ArenaRect {
  return { origin: { x, y }, size: { x: width, y: height } };
}

export function minX(area: ArenaRect): number {
  return area.origin.x;
}

export function maxX(area: ArenaRect): number {
  return area.origin.x + area.size.x;
}

export function minY(area: ArenaRect): number {
  return area.origin.y;
}

export function maxY(area: ArenaRect): number {
  return area.origin.y + area.size.y;
}

export function containsPoint(area: ArenaRect, point: Vector2): boolean {
  return point.x >= minX(area) && point.x <= maxX(area) && point.y >= minY(area) && point.y <= maxY(area);
}

export function expanded(area: ArenaRect, amount: number): ArenaRect {
  return rect(area.origin.x - amount, area.origin.y - amount, area.size.x + amount * 2, area.size.y + amount * 2);
}

export function intersectsSegment(area: ArenaRect, start: Vector2, end: Vector2): boolean {
  if (containsPoint(area, start) || containsPoint(area, end)) {
    return true;
  }

  const corners = [
    vec(minX(area), minY(area)),
    vec(maxX(area), minY(area)),
    vec(maxX(area), maxY(area)),
    vec(minX(area), maxY(area))
  ];

  return corners.some((corner, index) => segmentsIntersect(start, end, corner, corners[(index + 1) % corners.length]!));
}

function orientation(a: Vector2, b: Vector2, c: Vector2): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: Vector2, b: Vector2, c: Vector2): boolean {
  return b.x <= Math.max(a.x, c.x) && b.x >= Math.min(a.x, c.x) && b.y <= Math.max(a.y, c.y) && b.y >= Math.min(a.y, c.y);
}

function segmentsIntersect(p1: Vector2, q1: Vector2, p2: Vector2, q2: Vector2): boolean {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);
  const epsilon = 0.0001;

  if (o1 * o2 < 0 && o3 * o4 < 0) {
    return true;
  }
  if (Math.abs(o1) < epsilon && onSegment(p1, p2, q1)) return true;
  if (Math.abs(o2) < epsilon && onSegment(p1, q2, q1)) return true;
  if (Math.abs(o3) < epsilon && onSegment(p2, p1, q2)) return true;
  if (Math.abs(o4) < epsilon && onSegment(p2, q1, q2)) return true;

  return false;
}
