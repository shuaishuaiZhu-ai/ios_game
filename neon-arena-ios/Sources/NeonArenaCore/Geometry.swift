import Foundation

public struct Vector2: Codable, Equatable, Hashable, Sendable {
    public var x: Double
    public var y: Double

    public init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }

    public static let zero = Vector2(x: 0, y: 0)

    public var length: Double {
        (x * x + y * y).squareRoot()
    }

    public func normalized() -> Vector2 {
        let value = length
        guard value > 0.0001 else { return .zero }
        return Vector2(x: x / value, y: y / value)
    }

    public func distance(to other: Vector2) -> Double {
        (self - other).length
    }

    public static func + (lhs: Vector2, rhs: Vector2) -> Vector2 {
        Vector2(x: lhs.x + rhs.x, y: lhs.y + rhs.y)
    }

    public static func - (lhs: Vector2, rhs: Vector2) -> Vector2 {
        Vector2(x: lhs.x - rhs.x, y: lhs.y - rhs.y)
    }

    public static func * (lhs: Vector2, rhs: Double) -> Vector2 {
        Vector2(x: lhs.x * rhs, y: lhs.y * rhs)
    }
}

public struct ArenaRect: Codable, Equatable, Hashable, Sendable {
    public var origin: Vector2
    public var size: Vector2

    public init(x: Double, y: Double, width: Double, height: Double) {
        self.origin = Vector2(x: x, y: y)
        self.size = Vector2(x: width, y: height)
    }

    public var minX: Double { origin.x }
    public var maxX: Double { origin.x + size.x }
    public var minY: Double { origin.y }
    public var maxY: Double { origin.y + size.y }

    public func contains(_ point: Vector2) -> Bool {
        point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    }

    public func expanded(by amount: Double) -> ArenaRect {
        ArenaRect(
            x: origin.x - amount,
            y: origin.y - amount,
            width: size.x + amount * 2,
            height: size.y + amount * 2
        )
    }

    public func intersectsSegment(from start: Vector2, to end: Vector2) -> Bool {
        if contains(start) || contains(end) {
            return true
        }

        let corners = [
            Vector2(x: minX, y: minY),
            Vector2(x: maxX, y: minY),
            Vector2(x: maxX, y: maxY),
            Vector2(x: minX, y: maxY)
        ]

        for index in corners.indices {
            let next = corners[(index + 1) % corners.count]
            if segmentsIntersect(start, end, corners[index], next) {
                return true
            }
        }

        return false
    }
}

private func orientation(_ a: Vector2, _ b: Vector2, _ c: Vector2) -> Double {
    (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
}

private func onSegment(_ a: Vector2, _ b: Vector2, _ c: Vector2) -> Bool {
    b.x <= max(a.x, c.x) && b.x >= min(a.x, c.x) &&
        b.y <= max(a.y, c.y) && b.y >= min(a.y, c.y)
}

private func segmentsIntersect(_ p1: Vector2, _ q1: Vector2, _ p2: Vector2, _ q2: Vector2) -> Bool {
    let o1 = orientation(p1, q1, p2)
    let o2 = orientation(p1, q1, q2)
    let o3 = orientation(p2, q2, p1)
    let o4 = orientation(p2, q2, q1)
    let epsilon = 0.0001

    if o1 * o2 < 0 && o3 * o4 < 0 {
        return true
    }
    if abs(o1) < epsilon && onSegment(p1, p2, q1) { return true }
    if abs(o2) < epsilon && onSegment(p1, q2, q1) { return true }
    if abs(o3) < epsilon && onSegment(p2, p1, q2) { return true }
    if abs(o4) < epsilon && onSegment(p2, q1, q2) { return true }

    return false
}
