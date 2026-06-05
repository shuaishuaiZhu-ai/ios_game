import Foundation

public final class GameSession {
    public static let playerRadius = 18.0
    public static let pickupRadius = 32.0
    public static let hitRadius = 22.0

    public let config: MatchConfig
    public let map: MapDefinition

    private(set) public var tick: Int
    private(set) public var elapsedTime: Double
    private(set) public var players: [String: PlayerState]
    private(set) public var projectiles: [ProjectileState]
    private(set) public var droppedWeapons: [DroppedWeapon]
    private(set) public var eliminations: [Elimination]
    private(set) public var winnerID: String?
    private var authoritativeSafeZone: SafeZoneState?

    public init(config: MatchConfig, map: MapDefinition, playerIDs: [String]) {
        self.config = config
        self.map = map
        self.tick = 0
        self.elapsedTime = 0
        self.projectiles = []
        self.eliminations = []
        self.winnerID = nil

        var seededPlayers: [String: PlayerState] = [:]
        for (index, playerID) in playerIDs.prefix(config.playerCount).enumerated() {
            let spawn = map.spawnPoints[index % map.spawnPoints.count]
            seededPlayers[playerID] = PlayerState(id: playerID, position: spawn)
        }
        self.players = seededPlayers

        if config.mode.ruleset == .standard {
            self.droppedWeapons = map.weaponSpawnPoints.enumerated().map { index, spawn in
                let type = spawn.allowedTypes[index % spawn.allowedTypes.count]
                return DroppedWeapon(id: spawn.id, type: type, position: spawn.position)
            }
        } else {
            self.droppedWeapons = []
        }
    }

    public convenience init(config: MatchConfig, playerIDs: [String]) {
        let map = ArenaMaps.map(id: config.mapID) ?? ArenaMaps.neonGrid
        self.init(config: config, map: map, playerIDs: playerIDs)
    }

    public var safeZone: SafeZoneState {
        authoritativeSafeZone ?? map.safeZone.state(at: elapsedTime)
    }

    public func snapshot() -> MatchSnapshot {
        MatchSnapshot(
            tick: tick,
            players: players.values.sorted { $0.id < $1.id },
            projectiles: projectiles.sorted { $0.id < $1.id },
            droppedWeapons: droppedWeapons.sorted { $0.id < $1.id },
            safeZone: safeZone,
            eliminations: eliminations,
            winnerID: winnerID
        )
    }

    public func applyAuthoritativeSnapshot(_ snapshot: MatchSnapshot) {
        tick = snapshot.tick
        players = Dictionary(uniqueKeysWithValues: snapshot.players.map { ($0.id, $0) })
        projectiles = snapshot.projectiles
        droppedWeapons = snapshot.droppedWeapons
        eliminations = snapshot.eliminations
        winnerID = snapshot.winnerID
        authoritativeSafeZone = snapshot.safeZone
    }

    public func step(inputs: [PlayerInput], deltaTime: Double) {
        guard winnerID == nil else { return }

        authoritativeSafeZone = nil
        tick += 1
        elapsedTime += deltaTime

        var nextPlayers = players
        for id in nextPlayers.keys {
            let currentCooldown = nextPlayers[id]?.cooldownRemaining ?? 0
            nextPlayers[id]?.cooldownRemaining = max(0, currentCooldown - deltaTime)
        }

        var latestInputs: [String: PlayerInput] = [:]
        for input in inputs {
            latestInputs[input.playerID] = input
        }

        for input in latestInputs.values.sorted(by: { $0.playerID < $1.playerID }) {
            guard var player = nextPlayers[input.playerID], !player.isEliminated else { continue }

            let aim = input.aim.normalized()
            if aim.length > 0 {
                player.facing = aim
            }

            let movement = input.movement.normalized()
            let speed = 170.0
            let candidate = player.position + movement * speed * deltaTime
            player.position = constrainedPosition(for: candidate)
            nextPlayers[player.id] = player
        }

        players = nextPlayers
        applyPickups()

        for input in latestInputs.values.sorted(by: { $0.playerID < $1.playerID }) {
            guard let player = players[input.playerID], !player.isEliminated else { continue }
            if input.firePressed || input.meleeAction != nil {
                performAction(for: player, input: input)
            }
        }

        updateProjectiles(deltaTime: deltaTime)
        applySafeZoneDamage(deltaTime: deltaTime)
        updateWinner()
    }

    public func forcePlayerPosition(id: String, position: Vector2) {
        guard var player = players[id] else { return }
        player.position = position
        players[id] = player
    }

    private func constrainedPosition(for candidate: Vector2) -> Vector2 {
        let clamped = Vector2(
            x: min(max(candidate.x, GameSession.playerRadius), map.size.x - GameSession.playerRadius),
            y: min(max(candidate.y, GameSession.playerRadius), map.size.y - GameSession.playerRadius)
        )

        for wall in map.walls where wall.rect.expanded(by: GameSession.playerRadius).contains(clamped) {
            return nearestFreePoint(from: clamped, around: wall.rect.expanded(by: GameSession.playerRadius))
        }

        return clamped
    }

    private func nearestFreePoint(from point: Vector2, around rect: ArenaRect) -> Vector2 {
        let candidates = [
            Vector2(x: rect.minX - 0.1, y: point.y),
            Vector2(x: rect.maxX + 0.1, y: point.y),
            Vector2(x: point.x, y: rect.minY - 0.1),
            Vector2(x: point.x, y: rect.maxY + 0.1)
        ].map {
            Vector2(
                x: min(max($0.x, GameSession.playerRadius), map.size.x - GameSession.playerRadius),
                y: min(max($0.y, GameSession.playerRadius), map.size.y - GameSession.playerRadius)
            )
        }

        return candidates.min { $0.distance(to: point) < $1.distance(to: point) } ?? point
    }

    private func applyPickups() {
        guard config.mode.ruleset == .standard else {
            droppedWeapons = []
            for id in players.keys {
                players[id]?.weapon = nil
            }
            return
        }

        for weaponIndex in droppedWeapons.indices where !droppedWeapons[weaponIndex].isPickedUp {
            guard let picker = players.values
                .filter({ !$0.isEliminated })
                .first(where: { $0.position.distance(to: droppedWeapons[weaponIndex].position) <= GameSession.pickupRadius })
            else {
                continue
            }

            droppedWeapons[weaponIndex].isPickedUp = true
            players[picker.id]?.weapon = droppedWeapons[weaponIndex].type
        }
    }

    private func performAction(for player: PlayerState, input: PlayerInput) {
        guard player.cooldownRemaining <= 0 else { return }

        if config.mode.ruleset == .meleeOnly {
            let action = input.meleeAction ?? .punch
            applyMeleeAction(action, from: player)
            return
        }

        if let weapon = player.weapon {
            switch weapon {
            case .melee:
                applyWeaponMelee(from: player)
            case .ranged:
                spawnProjectile(from: player)
            }
        } else if let action = input.meleeAction {
            applyMeleeAction(action, from: player)
        }
    }

    private func applyWeaponMelee(from player: PlayerState) {
        let weapon = WeaponDefinition.energyBlade
        damageFirstTarget(inFrontOf: player, range: weapon.range, damage: weapon.damage)
        players[player.id]?.cooldownRemaining = weapon.cooldown
    }

    private func applyMeleeAction(_ action: MeleeAction, from player: PlayerState) {
        let stats = meleeStats(action)
        damageFirstTarget(inFrontOf: player, range: stats.range, damage: stats.damage)
        players[player.id]?.cooldownRemaining = stats.cooldown
    }

    private func meleeStats(_ action: MeleeAction) -> (damage: Double, range: Double, cooldown: Double) {
        switch action {
        case .punch:
            return (damage: 12, range: 38, cooldown: 0.28)
        case .flyingKick:
            return (damage: 22, range: 68, cooldown: 0.62)
        case .throw:
            return (damage: 26, range: 44, cooldown: 0.82)
        }
    }

    private func damageFirstTarget(inFrontOf player: PlayerState, range: Double, damage: Double) {
        let facing = player.facing.normalized()
        guard facing.length > 0 else { return }

        let target = players.values
            .filter { $0.id != player.id && !$0.isEliminated }
            .filter { candidate in
                let offset = candidate.position - player.position
                let distance = offset.length
                guard distance <= range + GameSession.hitRadius else { return false }
                let direction = offset.normalized()
                return direction.x * facing.x + direction.y * facing.y > 0.45
            }
            .min { $0.position.distance(to: player.position) < $1.position.distance(to: player.position) }

        guard let target else { return }
        damagePlayer(id: target.id, amount: damage)
    }

    private func spawnProjectile(from player: PlayerState) {
        let weapon = WeaponDefinition.pulseRifle
        let direction = player.facing.normalized()
        guard direction.length > 0 else { return }

        let projectile = ProjectileState(
            id: "p-\(tick)-\(projectiles.count)",
            ownerID: player.id,
            position: player.position + direction * 28,
            velocity: direction * weapon.projectileSpeed,
            damage: weapon.damage,
            remainingRange: weapon.range
        )

        projectiles.append(projectile)
        players[player.id]?.cooldownRemaining = weapon.cooldown
    }

    private func updateProjectiles(deltaTime: Double) {
        for index in projectiles.indices where projectiles[index].isActive {
            let start = projectiles[index].position
            let travel = projectiles[index].velocity * deltaTime
            let end = start + travel

            if map.walls.contains(where: { $0.rect.intersectsSegment(from: start, to: end) }) {
                projectiles[index].position = end
                projectiles[index].isActive = false
                continue
            }

            projectiles[index].position = end
            projectiles[index].remainingRange -= travel.length

            if let hit = players.values.first(where: {
                $0.id != projectiles[index].ownerID &&
                    !$0.isEliminated &&
                    $0.position.distance(to: end) <= GameSession.hitRadius
            }) {
                damagePlayer(id: hit.id, amount: projectiles[index].damage)
                projectiles[index].isActive = false
            }

            if projectiles[index].remainingRange <= 0 {
                projectiles[index].isActive = false
            }
        }

        projectiles.removeAll { !$0.isActive }
    }

    private func applySafeZoneDamage(deltaTime: Double) {
        let zone = safeZone
        for player in players.values where !player.isEliminated {
            if player.position.distance(to: zone.center) > zone.radius {
                damagePlayer(id: player.id, amount: zone.outsideDamagePerSecond * deltaTime)
            }
        }
    }

    private func damagePlayer(id: String, amount: Double) {
        guard var player = players[id], !player.isEliminated else { return }
        player.health = max(0, player.health - amount)
        if player.health <= 0 {
            player.isEliminated = true
            eliminations.append(Elimination(playerID: id, tick: tick))
        }
        players[id] = player
    }

    private func updateWinner() {
        let alive = players.values.filter { !$0.isEliminated }
        if alive.count == 1, let winner = alive.first {
            winnerID = winner.id
        } else if alive.isEmpty {
            winnerID = "draw"
        }
    }
}
