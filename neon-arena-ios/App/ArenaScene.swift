import SpriteKit

final class ArenaScene: SKScene {
    private let session: GameSession
    private let match: ActiveMatch
    private weak var input: ArenaInputModel?
    private var aiControllers: [AIController]
    private var networkSession: GameKitNetworkSession?
    private var remoteInputs: [String: PlayerInput] = [:]
    private var lastUpdateTime: TimeInterval = 0

    private var isHost: Bool {
        match.localPlayerID == match.playerIDs.sorted().first
    }

    init(match: ActiveMatch, input: ArenaInputModel) {
        self.match = match
        self.input = input
        self.session = GameSession(config: match.config, map: match.map, playerIDs: match.playerIDs)

        if case .single(let difficulty, _) = match.config.mode {
            self.aiControllers = match.playerIDs
                .filter { $0 != match.localPlayerID }
                .map { AIController(playerID: $0, difficulty: difficulty) }
        } else if match.match == nil {
            self.aiControllers = match.playerIDs
                .filter { $0 != match.localPlayerID }
                .map { AIController(playerID: $0, difficulty: .medium) }
        } else {
            self.aiControllers = []
        }

        super.init(size: CGSize(width: match.map.size.x, height: match.map.size.y))

        backgroundColor = SKColor(red: 0.02, green: 0.02, blue: 0.07, alpha: 1)

        if let gkMatch = match.match {
            let session = GameKitNetworkSession(match: gkMatch, localPlayerID: match.localPlayerID)
            session.onMessage = { [weak self] message in
                self?.handleNetworkMessage(message)
            }
            networkSession = session
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) is not supported")
    }

    override func update(_ currentTime: TimeInterval) {
        let delta = lastUpdateTime == 0 ? 1.0 / 30.0 : min(currentTime - lastUpdateTime, 1.0 / 15.0)
        lastUpdateTime = currentTime

        let localInput = makeLocalInput()
        var inputs = [localInput]
        inputs.append(contentsOf: remoteInputs.values)

        if networkSession == nil || isHost {
            let snapshot = session.snapshot()
            inputs.append(contentsOf: aiControllers.map { $0.input(from: snapshot, map: match.map) })
            session.step(inputs: inputs, deltaTime: delta)

            if isHost, let networkSession {
                try? networkSession.send(.snapshot(session.snapshot()))
            }
        } else if let networkSession {
            try? networkSession.send(.input(localInput))
        }

        render(snapshot: session.snapshot())
    }

    private func makeLocalInput() -> PlayerInput {
        let model = input
        let aim = model?.aim ?? Vector2(x: 1, y: 0)
        let movement = model?.movement ?? .zero
        let meleeAction = model?.meleeAction
        let firePressed = (model?.firePressed ?? false) || meleeAction != nil

        if movement.length > 0 {
            model?.aim = movement
        }

        return PlayerInput(
            playerID: match.localPlayerID,
            movement: movement,
            aim: aim,
            firePressed: firePressed,
            meleeAction: meleeAction,
            tick: session.tick
        )
    }

    private func handleNetworkMessage(_ message: NetworkMessage) {
        switch message {
        case .input(let input):
            remoteInputs[input.playerID] = input
        case .snapshot(let snapshot):
            if !isHost {
                session.applyAuthoritativeSnapshot(snapshot)
            }
        case .playerReady, .playerDisconnected:
            break
        }
    }

    private func render(snapshot: MatchSnapshot) {
        removeAllChildren()
        drawArena()
        drawSafeZone(snapshot.safeZone)
        drawWeapons(snapshot.droppedWeapons)
        drawProjectiles(snapshot.projectiles)
        drawPlayers(snapshot.players)
        drawHUD(snapshot)
    }

    private func drawArena() {
        for wall in match.map.walls {
            let node = SKShapeNode(rect: CGRect(
                x: wall.rect.origin.x,
                y: wall.rect.origin.y,
                width: wall.rect.size.x,
                height: wall.rect.size.y
            ))
            node.fillColor = SKColor(red: 0.08, green: 0.18, blue: 0.24, alpha: 1)
            node.strokeColor = .cyan
            node.lineWidth = 2
            addChild(node)
        }
    }

    private func drawSafeZone(_ zone: SafeZoneState) {
        let node = SKShapeNode(circleOfRadius: zone.radius)
        node.position = CGPoint(x: zone.center.x, y: zone.center.y)
        node.strokeColor = SKColor(red: 0.0, green: 0.95, blue: 1.0, alpha: 0.8)
        node.fillColor = SKColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 0.04)
        node.lineWidth = 4
        addChild(node)
    }

    private func drawWeapons(_ weapons: [DroppedWeapon]) {
        for weapon in weapons where !weapon.isPickedUp {
            let node = SKShapeNode(circleOfRadius: weapon.type == .melee ? 12 : 10)
            node.position = CGPoint(x: weapon.position.x, y: weapon.position.y)
            node.fillColor = weapon.type == .melee ? .systemPink : .systemYellow
            node.strokeColor = .white
            node.lineWidth = 1.5
            addChild(node)
        }
    }

    private func drawProjectiles(_ projectiles: [ProjectileState]) {
        for projectile in projectiles {
            let node = SKShapeNode(circleOfRadius: 5)
            node.position = CGPoint(x: projectile.position.x, y: projectile.position.y)
            node.fillColor = .cyan
            node.strokeColor = .white
            addChild(node)
        }
    }

    private func drawPlayers(_ players: [PlayerState]) {
        for player in players {
            let body = SKShapeNode(circleOfRadius: GameSession.playerRadius)
            body.position = CGPoint(x: player.position.x, y: player.position.y)
            body.fillColor = player.id == match.localPlayerID ? .cyan : .systemPink
            body.strokeColor = player.isEliminated ? .gray : .white
            body.lineWidth = 2
            body.alpha = player.isEliminated ? 0.3 : 1
            addChild(body)

            let healthWidth = 46.0 * max(0, player.health / 100)
            let health = SKShapeNode(rect: CGRect(x: -23, y: 28, width: healthWidth, height: 5), cornerRadius: 2)
            health.position = body.position
            health.fillColor = .green
            health.strokeColor = .clear
            addChild(health)

            let label = SKLabelNode(text: player.weapon?.rawValue ?? "fists")
            label.fontSize = 10
            label.fontName = "AvenirNext-Bold"
            label.fontColor = .white
            label.position = CGPoint(x: player.position.x, y: player.position.y - 34)
            addChild(label)
        }
    }

    private func drawHUD(_ snapshot: MatchSnapshot) {
        let zone = snapshot.safeZone
        let phaseText = "Zone \(zone.phase + 1)/3"
        let label = SKLabelNode(text: phaseText)
        label.fontName = "AvenirNext-Bold"
        label.fontSize = 18
        label.fontColor = .cyan
        label.position = CGPoint(x: 84, y: size.height - 42)
        addChild(label)

        if let winnerID = snapshot.winnerID {
            let winner = SKLabelNode(text: winnerID == "draw" ? "Draw" : "Winner: \(winnerID)")
            winner.fontName = "AvenirNext-Heavy"
            winner.fontSize = 32
            winner.fontColor = .white
            winner.position = CGPoint(x: size.width / 2, y: size.height / 2)
            addChild(winner)
        }
    }
}
