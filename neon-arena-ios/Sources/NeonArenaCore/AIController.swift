import Foundation

public struct AIController: Sendable {
    public var playerID: String
    public var difficulty: Difficulty

    public init(playerID: String, difficulty: Difficulty) {
        self.playerID = playerID
        self.difficulty = difficulty
    }

    public func input(from snapshot: MatchSnapshot, map: MapDefinition) -> PlayerInput {
        guard let selfPlayer = snapshot.players.first(where: { $0.id == playerID && !$0.isEliminated }) else {
            return PlayerInput(playerID: playerID, movement: .zero, aim: .zero, firePressed: false, meleeAction: nil, tick: snapshot.tick)
        }

        let safeMovement = movementTowardSafeZoneIfNeeded(player: selfPlayer, safeZone: snapshot.safeZone)
        let target = nearestOpponent(to: selfPlayer, in: snapshot.players)
        let targetVector = target.map { $0.position - selfPlayer.position } ?? Vector2(x: 1, y: 0)
        let aim = adjustedAim(targetVector.normalized())
        let combatMovement = movement(for: selfPlayer, target: target, map: map)
        let movement = safeMovement.length > 0 ? safeMovement : combatMovement

        return PlayerInput(
            playerID: playerID,
            movement: movement,
            aim: aim,
            firePressed: shouldAttack(distance: targetVector.length, tick: snapshot.tick),
            meleeAction: meleeAction(distance: targetVector.length),
            tick: snapshot.tick
        )
    }

    public func movementTowardSafeZoneIfNeeded(player: PlayerState, safeZone: SafeZoneState) -> Vector2 {
        let distance = player.position.distance(to: safeZone.center)
        guard distance > safeZone.radius * 0.82 else { return .zero }
        return (safeZone.center - player.position).normalized()
    }

    private func nearestOpponent(to player: PlayerState, in players: [PlayerState]) -> PlayerState? {
        players
            .filter { $0.id != player.id && !$0.isEliminated }
            .min { $0.position.distance(to: player.position) < $1.position.distance(to: player.position) }
    }

    private func movement(for player: PlayerState, target: PlayerState?, map: MapDefinition) -> Vector2 {
        guard let target else { return .zero }
        let offset = target.position - player.position
        let distance = offset.length

        switch difficulty {
        case .easy:
            return distance > 160 ? offset.normalized() : Vector2(x: -offset.y, y: offset.x).normalized() * 0.35
        case .medium:
            return distance > 130 ? offset.normalized() : Vector2(x: -offset.y, y: offset.x).normalized()
        case .hard:
            if distance < 80 {
                return (player.position - target.position).normalized()
            }
            return (offset.normalized() + Vector2(x: -offset.y, y: offset.x).normalized() * 0.45).normalized()
        }
    }

    private func adjustedAim(_ aim: Vector2) -> Vector2 {
        switch difficulty {
        case .easy:
            return (aim + Vector2(x: 0.24, y: -0.16)).normalized()
        case .medium:
            return (aim + Vector2(x: 0.08, y: -0.05)).normalized()
        case .hard:
            return aim
        }
    }

    private func shouldAttack(distance: Double, tick: Int) -> Bool {
        switch difficulty {
        case .easy:
            return tick % 22 == 0 && distance < 360
        case .medium:
            return tick % 14 == 0 && distance < 430
        case .hard:
            return tick % 8 == 0 && distance < 480
        }
    }

    private func meleeAction(distance: Double) -> MeleeAction? {
        guard distance < 72 else { return nil }
        switch difficulty {
        case .easy:
            return .punch
        case .medium:
            return distance > 44 ? .flyingKick : .punch
        case .hard:
            return distance < 42 ? .throw : .flyingKick
        }
    }
}
