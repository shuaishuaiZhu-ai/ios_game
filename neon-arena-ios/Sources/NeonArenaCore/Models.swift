import Foundation

public enum Difficulty: String, Codable, CaseIterable, Sendable {
    case easy
    case medium
    case hard
}

public enum Ruleset: String, Codable, CaseIterable, Sendable {
    case standard
    case meleeOnly
}

public enum GameMode: Codable, Equatable, Sendable {
    case single(difficulty: Difficulty, ruleset: Ruleset)
    case onlineDuel(ruleset: Ruleset)
    case onlineFFA(ruleset: Ruleset)

    public var ruleset: Ruleset {
        switch self {
        case .single(_, let ruleset), .onlineDuel(let ruleset), .onlineFFA(let ruleset):
            return ruleset
        }
    }
}

public enum WeaponType: String, Codable, CaseIterable, Sendable {
    case melee
    case ranged
}

public enum MeleeAction: String, Codable, CaseIterable, Sendable {
    case punch
    case flyingKick
    case `throw`
}

public struct WeaponDefinition: Codable, Equatable, Sendable {
    public var type: WeaponType
    public var name: String
    public var damage: Double
    public var range: Double
    public var cooldown: Double
    public var projectileSpeed: Double

    public init(
        type: WeaponType,
        name: String,
        damage: Double,
        range: Double,
        cooldown: Double,
        projectileSpeed: Double = 0
    ) {
        self.type = type
        self.name = name
        self.damage = damage
        self.range = range
        self.cooldown = cooldown
        self.projectileSpeed = projectileSpeed
    }

    public static let energyBlade = WeaponDefinition(
        type: .melee,
        name: "Energy Blade",
        damage: 34,
        range: 48,
        cooldown: 0.45
    )

    public static let pulseRifle = WeaponDefinition(
        type: .ranged,
        name: "Pulse Rifle",
        damage: 16,
        range: 420,
        cooldown: 0.32,
        projectileSpeed: 520
    )

    public static func definition(for type: WeaponType) -> WeaponDefinition {
        switch type {
        case .melee:
            return .energyBlade
        case .ranged:
            return .pulseRifle
        }
    }
}

public struct MatchConfig: Codable, Equatable, Sendable {
    public var mode: GameMode
    public var mapID: String
    public var playerCount: Int
    public var seed: Int
    public var tickRate: Double

    public init(mode: GameMode, mapID: String, playerCount: Int, seed: Int = 1, tickRate: Double = 30) {
        self.mode = mode
        self.mapID = mapID
        self.playerCount = playerCount
        self.seed = seed
        self.tickRate = tickRate
    }
}

public struct PlayerInput: Codable, Equatable, Sendable {
    public var playerID: String
    public var movement: Vector2
    public var aim: Vector2
    public var firePressed: Bool
    public var meleeAction: MeleeAction?
    public var tick: Int

    public init(
        playerID: String,
        movement: Vector2,
        aim: Vector2,
        firePressed: Bool,
        meleeAction: MeleeAction?,
        tick: Int
    ) {
        self.playerID = playerID
        self.movement = movement
        self.aim = aim
        self.firePressed = firePressed
        self.meleeAction = meleeAction
        self.tick = tick
    }
}

public struct PlayerState: Codable, Equatable, Sendable {
    public var id: String
    public var position: Vector2
    public var health: Double
    public var facing: Vector2
    public var weapon: WeaponType?
    public var isEliminated: Bool
    public var cooldownRemaining: Double

    public init(
        id: String,
        position: Vector2,
        health: Double = 100,
        facing: Vector2 = Vector2(x: 1, y: 0),
        weapon: WeaponType? = nil,
        isEliminated: Bool = false,
        cooldownRemaining: Double = 0
    ) {
        self.id = id
        self.position = position
        self.health = health
        self.facing = facing
        self.weapon = weapon
        self.isEliminated = isEliminated
        self.cooldownRemaining = cooldownRemaining
    }
}

public struct ProjectileState: Codable, Equatable, Sendable {
    public var id: String
    public var ownerID: String
    public var position: Vector2
    public var velocity: Vector2
    public var damage: Double
    public var remainingRange: Double
    public var isActive: Bool

    public init(
        id: String,
        ownerID: String,
        position: Vector2,
        velocity: Vector2,
        damage: Double,
        remainingRange: Double,
        isActive: Bool = true
    ) {
        self.id = id
        self.ownerID = ownerID
        self.position = position
        self.velocity = velocity
        self.damage = damage
        self.remainingRange = remainingRange
        self.isActive = isActive
    }
}

public struct DroppedWeapon: Codable, Equatable, Sendable {
    public var id: String
    public var type: WeaponType
    public var position: Vector2
    public var isPickedUp: Bool

    public init(id: String, type: WeaponType, position: Vector2, isPickedUp: Bool = false) {
        self.id = id
        self.type = type
        self.position = position
        self.isPickedUp = isPickedUp
    }
}

public struct Elimination: Codable, Equatable, Sendable {
    public var playerID: String
    public var tick: Int

    public init(playerID: String, tick: Int) {
        self.playerID = playerID
        self.tick = tick
    }
}

public struct SafeZoneState: Codable, Equatable, Sendable {
    public var phase: Int
    public var center: Vector2
    public var radius: Double
    public var nextShrinkTime: Double
    public var outsideDamagePerSecond: Double

    public init(
        phase: Int,
        center: Vector2,
        radius: Double,
        nextShrinkTime: Double,
        outsideDamagePerSecond: Double
    ) {
        self.phase = phase
        self.center = center
        self.radius = radius
        self.nextShrinkTime = nextShrinkTime
        self.outsideDamagePerSecond = outsideDamagePerSecond
    }
}

public struct MatchSnapshot: Codable, Equatable, Sendable {
    public var tick: Int
    public var players: [PlayerState]
    public var projectiles: [ProjectileState]
    public var droppedWeapons: [DroppedWeapon]
    public var safeZone: SafeZoneState
    public var eliminations: [Elimination]
    public var winnerID: String?

    public init(
        tick: Int,
        players: [PlayerState],
        projectiles: [ProjectileState],
        droppedWeapons: [DroppedWeapon],
        safeZone: SafeZoneState,
        eliminations: [Elimination],
        winnerID: String?
    ) {
        self.tick = tick
        self.players = players
        self.projectiles = projectiles
        self.droppedWeapons = droppedWeapons
        self.safeZone = safeZone
        self.eliminations = eliminations
        self.winnerID = winnerID
    }
}
