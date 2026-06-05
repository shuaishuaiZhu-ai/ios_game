import XCTest
@testable import NeonArenaCore

final class NeonArenaCoreTests: XCTestCase {
    func testMapDefinitionsAreValid() {
        XCTAssertEqual(ArenaMaps.all.count, 3)

        for map in ArenaMaps.all {
            XCTAssertGreaterThanOrEqual(map.spawnPoints.count, 4)
            XCTAssertGreaterThanOrEqual(map.weaponSpawnPoints.count, 4)
            XCTAssertEqual(map.safeZone.phaseRadii.count, 3)
            XCTAssertGreaterThan(map.safeZone.phaseRadii[0], map.safeZone.phaseRadii[1])
            XCTAssertGreaterThan(map.safeZone.phaseRadii[1], map.safeZone.phaseRadii[2])
        }
    }

    func testPlayerCannotMoveThroughWalls() {
        let map = testMap(
            walls: [ArenaWall(id: "wall", rect: ArenaRect(x: 120, y: 100, width: 50, height: 80))],
            weaponSpawns: []
        )
        let session = GameSession(config: standardConfig(mapID: map.id), map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 90, y: 140))

        session.step(
            inputs: [
                PlayerInput(playerID: "p1", movement: Vector2(x: 1, y: 0), aim: Vector2(x: 1, y: 0), firePressed: false, meleeAction: nil, tick: 0)
            ],
            deltaTime: 0.5
        )

        let player = session.snapshot().players.first { $0.id == "p1" }!
        XCTAssertFalse(map.walls[0].rect.expanded(by: GameSession.playerRadius).contains(player.position))
    }

    func testRangedProjectileIsBlockedByWall() {
        let map = testMap(
            walls: [ArenaWall(id: "cover", rect: ArenaRect(x: 160, y: 80, width: 30, height: 90))],
            weaponSpawns: [
                WeaponSpawnPoint(id: "rifle", position: Vector2(x: 100, y: 120), allowedTypes: [.ranged])
            ]
        )
        let session = GameSession(config: standardConfig(mapID: map.id), map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 100, y: 120))
        session.forcePlayerPosition(id: "p2", position: Vector2(x: 260, y: 120))

        session.step(
            inputs: [
                PlayerInput(playerID: "p1", movement: .zero, aim: Vector2(x: 1, y: 0), firePressed: true, meleeAction: nil, tick: 0)
            ],
            deltaTime: 0.2
        )

        let snapshot = session.snapshot()
        let target = snapshot.players.first { $0.id == "p2" }!
        XCTAssertEqual(target.health, 100)
        XCTAssertTrue(snapshot.projectiles.isEmpty)
    }

    func testMeleeWeaponDamageIsHigherThanRangedDamage() {
        XCTAssertGreaterThan(WeaponDefinition.energyBlade.damage, WeaponDefinition.pulseRifle.damage)
    }

    func testMeleeOnlyModeDisablesWeaponPickupsAndProjectiles() {
        let map = testMap(
            walls: [],
            weaponSpawns: [
                WeaponSpawnPoint(id: "rifle", position: Vector2(x: 100, y: 100), allowedTypes: [.ranged])
            ]
        )
        let config = MatchConfig(mode: .single(difficulty: .medium, ruleset: .meleeOnly), mapID: map.id, playerCount: 2)
        let session = GameSession(config: config, map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 100, y: 100))
        session.forcePlayerPosition(id: "p2", position: Vector2(x: 132, y: 100))

        session.step(
            inputs: [
                PlayerInput(playerID: "p1", movement: .zero, aim: Vector2(x: 1, y: 0), firePressed: true, meleeAction: .punch, tick: 0)
            ],
            deltaTime: 0.1
        )

        let snapshot = session.snapshot()
        XCTAssertTrue(snapshot.droppedWeapons.isEmpty)
        XCTAssertTrue(snapshot.projectiles.isEmpty)
        XCTAssertLessThan(snapshot.players.first { $0.id == "p2" }!.health, 100)
    }

    func testFlyingKickAndThrowAreEnabledInMeleeOnlyMode() {
        XCTAssertEqual(healthAfterMeleeAction(.flyingKick), 78)
        XCTAssertEqual(healthAfterMeleeAction(.throw), 74)
    }

    func testSafeZoneHasThreePhasesAndDamagesOutsidePlayers() {
        let map = ArenaMaps.neonGrid
        let config = standardConfig(mapID: map.id)
        let session = GameSession(config: config, map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 18, y: 18))
        session.forcePlayerPosition(id: "p2", position: map.safeZone.center)

        let phase0 = map.safeZone.state(at: 0)
        let phase1 = map.safeZone.state(at: 45)
        let phase2 = map.safeZone.state(at: 90)
        XCTAssertEqual([phase0.phase, phase1.phase, phase2.phase], [0, 1, 2])
        XCTAssertGreaterThan(phase0.radius, phase1.radius)
        XCTAssertGreaterThan(phase1.radius, phase2.radius)

        session.step(inputs: [], deltaTime: 1.0)
        let damaged = session.snapshot().players.first { $0.id == "p1" }!
        XCTAssertLessThan(damaged.health, 100)
    }

    func testSafeZoneCanDecideWinner() {
        let map = testMap(
            walls: [],
            weaponSpawns: [],
            safeZone: SafeZoneConfig(center: Vector2(x: 250, y: 250), phaseRadii: [80, 60, 40], phaseDuration: 45, outsideDamagePerSecond: 120)
        )
        let session = GameSession(config: standardConfig(mapID: map.id), map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 20, y: 20))
        session.forcePlayerPosition(id: "p2", position: Vector2(x: 250, y: 250))

        session.step(inputs: [], deltaTime: 1.0)

        XCTAssertEqual(session.snapshot().winnerID, "p2")
    }

    func testAIHardDifficultyMovesTowardSafeZoneWhenOutside() {
        let ai = AIController(playerID: "bot", difficulty: .hard)
        let player = PlayerState(id: "bot", position: Vector2(x: 10, y: 10))
        let zone = SafeZoneState(phase: 1, center: Vector2(x: 100, y: 100), radius: 30, nextShrinkTime: 90, outsideDamagePerSecond: 10)

        let movement = ai.movementTowardSafeZoneIfNeeded(player: player, safeZone: zone)

        XCTAssertGreaterThan(movement.x, 0)
        XCTAssertGreaterThan(movement.y, 0)
    }

    func testNetworkMessagesEncodeSnapshots() throws {
        let session = GameSession(config: standardConfig(mapID: ArenaMaps.neonGrid.id), playerIDs: ["p1", "p2"])
        let message = NetworkMessage.snapshot(session.snapshot())

        let data = try JSONEncoder().encode(message)
        let decoded = try JSONDecoder().decode(NetworkMessage.self, from: data)

        XCTAssertEqual(decoded, message)
    }

    func testMockNetworkSessionStoresSynchronizedSafeZoneSnapshot() throws {
        let config = MatchConfig(mode: .onlineFFA(ruleset: .standard), mapID: ArenaMaps.neonGrid.id, playerCount: 4)
        let session = GameSession(config: config, playerIDs: ["p1", "p2", "p3", "p4"])
        let network = MockNetworkSession(localPlayerID: "p1", connectedPlayerIDs: ["p2", "p3", "p4"])
        try network.send(.snapshot(session.snapshot()))

        guard case .snapshot(let snapshot)? = network.sentMessages.first else {
            return XCTFail("Expected a snapshot message")
        }

        XCTAssertEqual(snapshot.safeZone.phase, 0)
        XCTAssertEqual(snapshot.players.count, 4)
    }

    private func healthAfterMeleeAction(_ action: MeleeAction) -> Double {
        let map = testMap(walls: [], weaponSpawns: [])
        let config = MatchConfig(mode: .single(difficulty: .medium, ruleset: .meleeOnly), mapID: map.id, playerCount: 2)
        let session = GameSession(config: config, map: map, playerIDs: ["p1", "p2"])
        session.forcePlayerPosition(id: "p1", position: Vector2(x: 100, y: 100))
        session.forcePlayerPosition(id: "p2", position: Vector2(x: 138, y: 100))
        session.step(
            inputs: [
                PlayerInput(playerID: "p1", movement: .zero, aim: Vector2(x: 1, y: 0), firePressed: true, meleeAction: action, tick: 0)
            ],
            deltaTime: 0.1
        )
        return session.snapshot().players.first { $0.id == "p2" }!.health
    }

    private func standardConfig(mapID: String) -> MatchConfig {
        MatchConfig(mode: .single(difficulty: .medium, ruleset: .standard), mapID: mapID, playerCount: 2)
    }

    private func testMap(
        walls: [ArenaWall],
        weaponSpawns: [WeaponSpawnPoint],
        safeZone: SafeZoneConfig = SafeZoneConfig(center: Vector2(x: 250, y: 250), phaseRadii: [300, 180, 90], phaseDuration: 45, outsideDamagePerSecond: 10)
    ) -> MapDefinition {
        MapDefinition(
            id: "test-map",
            name: "Test Map",
            size: Vector2(x: 500, y: 500),
            walls: walls,
            spawnPoints: [
                Vector2(x: 80, y: 80),
                Vector2(x: 420, y: 420),
                Vector2(x: 80, y: 420),
                Vector2(x: 420, y: 80)
            ],
            weaponSpawnPoints: weaponSpawns,
            safeZone: safeZone
        )
    }
}
