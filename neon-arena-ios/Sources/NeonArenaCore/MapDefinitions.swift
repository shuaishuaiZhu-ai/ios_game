import Foundation

public struct ArenaWall: Codable, Equatable, Sendable {
    public var id: String
    public var rect: ArenaRect

    public init(id: String, rect: ArenaRect) {
        self.id = id
        self.rect = rect
    }
}

public struct WeaponSpawnPoint: Codable, Equatable, Sendable {
    public var id: String
    public var position: Vector2
    public var allowedTypes: [WeaponType]

    public init(id: String, position: Vector2, allowedTypes: [WeaponType]) {
        self.id = id
        self.position = position
        self.allowedTypes = allowedTypes
    }
}

public struct SafeZoneConfig: Codable, Equatable, Sendable {
    public var center: Vector2
    public var phaseRadii: [Double]
    public var phaseDuration: Double
    public var outsideDamagePerSecond: Double

    public init(center: Vector2, phaseRadii: [Double], phaseDuration: Double, outsideDamagePerSecond: Double) {
        self.center = center
        self.phaseRadii = phaseRadii
        self.phaseDuration = phaseDuration
        self.outsideDamagePerSecond = outsideDamagePerSecond
    }

    public func state(at elapsedTime: Double) -> SafeZoneState {
        let rawPhase = Int(elapsedTime / phaseDuration)
        let phase = min(max(rawPhase, 0), phaseRadii.count - 1)
        let nextTime = phase == phaseRadii.count - 1
            ? Double(phaseRadii.count) * phaseDuration
            : Double(phase + 1) * phaseDuration

        return SafeZoneState(
            phase: phase,
            center: center,
            radius: phaseRadii[phase],
            nextShrinkTime: nextTime,
            outsideDamagePerSecond: outsideDamagePerSecond
        )
    }
}

public struct MapDefinition: Codable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var size: Vector2
    public var walls: [ArenaWall]
    public var spawnPoints: [Vector2]
    public var weaponSpawnPoints: [WeaponSpawnPoint]
    public var safeZone: SafeZoneConfig

    public init(
        id: String,
        name: String,
        size: Vector2,
        walls: [ArenaWall],
        spawnPoints: [Vector2],
        weaponSpawnPoints: [WeaponSpawnPoint],
        safeZone: SafeZoneConfig
    ) {
        self.id = id
        self.name = name
        self.size = size
        self.walls = walls
        self.spawnPoints = spawnPoints
        self.weaponSpawnPoints = weaponSpawnPoints
        self.safeZone = safeZone
    }
}

public enum ArenaMaps {
    public static let neonGrid = MapDefinition(
        id: "neon-grid",
        name: "Neon Grid",
        size: Vector2(x: 900, y: 620),
        walls: [
            ArenaWall(id: "center-short-a", rect: ArenaRect(x: 405, y: 210, width: 90, height: 24)),
            ArenaWall(id: "center-short-b", rect: ArenaRect(x: 405, y: 386, width: 90, height: 24)),
            ArenaWall(id: "left-cover", rect: ArenaRect(x: 210, y: 275, width: 32, height: 70)),
            ArenaWall(id: "right-cover", rect: ArenaRect(x: 658, y: 275, width: 32, height: 70))
        ],
        spawnPoints: [
            Vector2(x: 120, y: 120),
            Vector2(x: 780, y: 500),
            Vector2(x: 120, y: 500),
            Vector2(x: 780, y: 120)
        ],
        weaponSpawnPoints: [
            WeaponSpawnPoint(id: "grid-melee-a", position: Vector2(x: 310, y: 310), allowedTypes: [.melee]),
            WeaponSpawnPoint(id: "grid-ranged-a", position: Vector2(x: 450, y: 140), allowedTypes: [.ranged]),
            WeaponSpawnPoint(id: "grid-melee-b", position: Vector2(x: 590, y: 310), allowedTypes: [.melee]),
            WeaponSpawnPoint(id: "grid-ranged-b", position: Vector2(x: 450, y: 480), allowedTypes: [.ranged])
        ],
        safeZone: SafeZoneConfig(
            center: Vector2(x: 450, y: 310),
            phaseRadii: [430, 285, 150],
            phaseDuration: 45,
            outsideDamagePerSecond: 9
        )
    )

    public static let foundryLanes = MapDefinition(
        id: "foundry-lanes",
        name: "Foundry Lanes",
        size: Vector2(x: 900, y: 620),
        walls: [
            ArenaWall(id: "lane-top-left", rect: ArenaRect(x: 180, y: 160, width: 280, height: 28)),
            ArenaWall(id: "lane-top-right", rect: ArenaRect(x: 540, y: 160, width: 180, height: 28)),
            ArenaWall(id: "lane-bottom-left", rect: ArenaRect(x: 180, y: 432, width: 180, height: 28)),
            ArenaWall(id: "lane-bottom-right", rect: ArenaRect(x: 440, y: 432, width: 280, height: 28)),
            ArenaWall(id: "vertical-choke-a", rect: ArenaRect(x: 315, y: 250, width: 32, height: 120)),
            ArenaWall(id: "vertical-choke-b", rect: ArenaRect(x: 553, y: 250, width: 32, height: 120))
        ],
        spawnPoints: [
            Vector2(x: 112, y: 310),
            Vector2(x: 788, y: 310),
            Vector2(x: 450, y: 88),
            Vector2(x: 450, y: 532)
        ],
        weaponSpawnPoints: [
            WeaponSpawnPoint(id: "foundry-melee-a", position: Vector2(x: 240, y: 310), allowedTypes: [.melee]),
            WeaponSpawnPoint(id: "foundry-melee-b", position: Vector2(x: 660, y: 310), allowedTypes: [.melee]),
            WeaponSpawnPoint(id: "foundry-ranged-a", position: Vector2(x: 450, y: 222), allowedTypes: [.ranged]),
            WeaponSpawnPoint(id: "foundry-ranged-b", position: Vector2(x: 450, y: 398), allowedTypes: [.ranged])
        ],
        safeZone: SafeZoneConfig(
            center: Vector2(x: 450, y: 310),
            phaseRadii: [420, 260, 135],
            phaseDuration: 45,
            outsideDamagePerSecond: 10
        )
    )

    public static let skylineRuins = MapDefinition(
        id: "skyline-ruins",
        name: "Skyline Ruins",
        size: Vector2(x: 900, y: 620),
        walls: [
            ArenaWall(id: "ruin-a", rect: ArenaRect(x: 260, y: 180, width: 52, height: 118)),
            ArenaWall(id: "ruin-b", rect: ArenaRect(x: 598, y: 322, width: 52, height: 118)),
            ArenaWall(id: "ruin-c", rect: ArenaRect(x: 392, y: 288, width: 126, height: 28)),
            ArenaWall(id: "ruin-d", rect: ArenaRect(x: 150, y: 438, width: 126, height: 28)),
            ArenaWall(id: "ruin-e", rect: ArenaRect(x: 624, y: 154, width: 126, height: 28))
        ],
        spawnPoints: [
            Vector2(x: 130, y: 130),
            Vector2(x: 770, y: 490),
            Vector2(x: 160, y: 500),
            Vector2(x: 740, y: 120)
        ],
        weaponSpawnPoints: [
            WeaponSpawnPoint(id: "sky-ranged-a", position: Vector2(x: 448, y: 118), allowedTypes: [.ranged]),
            WeaponSpawnPoint(id: "sky-ranged-b", position: Vector2(x: 448, y: 502), allowedTypes: [.ranged]),
            WeaponSpawnPoint(id: "sky-melee-a", position: Vector2(x: 330, y: 310), allowedTypes: [.melee]),
            WeaponSpawnPoint(id: "sky-melee-b", position: Vector2(x: 570, y: 310), allowedTypes: [.melee])
        ],
        safeZone: SafeZoneConfig(
            center: Vector2(x: 450, y: 310),
            phaseRadii: [435, 295, 165],
            phaseDuration: 45,
            outsideDamagePerSecond: 8
        )
    )

    public static let all: [MapDefinition] = [
        neonGrid,
        foundryLanes,
        skylineRuins
    ]

    public static func map(id: String) -> MapDefinition? {
        all.first { $0.id == id }
    }
}
