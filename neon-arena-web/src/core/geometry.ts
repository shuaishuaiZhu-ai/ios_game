export interface Vector2 {
  x: number;
  y: number;
}

export interface ArenaRect {
  origin: Vector2;
  size: Vector2;
}

export const zeroVector: Vector2 = { x: 0, y: 0 };

export function vec(x: number, y: number): Vector2 {
  return { x, y };
}

export function rect(x: number, y: number, w: number, h: number): ArenaRect {
  return { origin: vec(x, y), size: vec(w, h) };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return vec(a.x + b.x, a.y + b.y);
}

export function sub(a: Vector2, b: Vector2): Vector2 {
  return vec(a.x - b.x, a.y - b.y);
}

export function scale(v: Vector2, scalar: number): Vector2 {
  return vec(v.x * scalar, v.y * scalar);
}

export function length(v: Vector2): number {
  return Math.hypot(v.x, v.y);
}

export function distance(a: Vector2, b: Vector2): number {
  return length(sub(a, b));
}

export function normalize(v: Vector2): Vector2 {
  const mag = length(v);
  return mag > 0.00001 ? vec(v.x / mag, v.y / mag) : { ...zeroVector };
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function minX(rectangle: ArenaRect): number {
  return rectangle.origin.x;
}

export function maxX(rectangle: ArenaRect): number {
  return rectangle.origin.x + rectangle.size.x;
}

export function minY(rectangle: ArenaRect): number {
  return rectangle.origin.y;
}

export function maxY(rectangle: ArenaRect): number {
  return rectangle.origin.y + rectangle.size.y;
}

export function centerOf(rectangle: ArenaRect): Vector2 {
  return vec(rectangle.origin.x + rectangle.size.x / 2, rectangle.origin.y + rectangle.size.y / 2);
}

export function expanded(rectangle: ArenaRect, amount: number): ArenaRect {
  return rect(
    rectangle.origin.x - amount,
    rectangle.origin.y - amount,
    rectangle.size.x + amount * 2,
    rectangle.size.y + amount * 2
  );
}

export function containsPoint(rectangle: ArenaRect, point: Vector2): boolean {
  return point.x >= minX(rectangle) && point.x <= maxX(rectangle) && point.y >= minY(rectangle) && point.y <= maxY(rectangle);
}

export function clampPoint(point: Vector2, min: Vector2, max: Vector2): Vector2 {
  return vec(Math.min(Math.max(point.x, min.x), max.x), Math.min(Math.max(point.y, min.y), max.y));
}

export function nearestPointOnRect(rectangle: ArenaRect, point: Vector2): Vector2 {
  return vec(Math.min(Math.max(point.x, minX(rectangle)), maxX(rectangle)), Math.min(Math.max(point.y, minY(rectangle)), maxY(rectangle)));
}

export function intersectsSegment(rectangle: ArenaRect, start: Vector2, end: Vector2): boolean {
  if (containsPoint(rectangle, start) || containsPoint(rectangle, end)) return true;
  const edges: Array<[Vector2, Vector2]> = [
    [vec(minX(rectangle), minY(rectangle)), vec(maxX(rectangle), minY(rectangle))],
    [vec(maxX(rectangle), minY(rectangle)), vec(maxX(rectangle), maxY(rectangle))],
    [vec(maxX(rectangle), maxY(rectangle)), vec(minX(rectangle), maxY(rectangle))],
    [vec(minX(rectangle), maxY(rectangle)), vec(minX(rectangle), minY(rectangle))]
  ];
  return edges.some(([a, b]) => segmentsIntersect(start, end, a, b));
}

function segmentsIntersect(a: Vector2, b: Vector2, c: Vector2, d: Vector2): boolean {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ad = sub(d, a);
  const cd = sub(d, c);
  const ca = sub(a, c);
  const cb = sub(b, c);
  const cross1 = cross(ab, ac);
  const cross2 = cross(ab, ad);
  const cross3 = cross(cd, ca);
  const cross4 = cross(cd, cb);
  return cross1 * cross2 <= 0 && cross3 * cross4 <= 0;
}

function cross(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
