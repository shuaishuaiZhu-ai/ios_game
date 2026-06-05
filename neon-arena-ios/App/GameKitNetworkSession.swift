import Foundation
import GameKit

final class GameKitNetworkSession: NSObject, NetworkSession, GKMatchDelegate {
    let localPlayerID: String
    private let match: GKMatch
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    var onMessage: ((NetworkMessage) -> Void)?

    var connectedPlayerIDs: [String] {
        match.players.map(\.gamePlayerID)
    }

    init(match: GKMatch, localPlayerID: String) {
        self.match = match
        self.localPlayerID = localPlayerID
        super.init()
        self.match.delegate = self
    }

    func send(_ message: NetworkMessage) throws {
        let data = try encoder.encode(message)
        try match.sendData(toAllPlayers: data, with: .unreliable)
    }

    func match(_ match: GKMatch, didReceive data: Data, fromRemotePlayer player: GKPlayer) {
        guard let message = try? decoder.decode(NetworkMessage.self, from: data) else { return }
        onMessage?(message)
    }

    func match(_ match: GKMatch, player: GKPlayer, didChange state: GKPlayerConnectionState) {
        if state == .disconnected {
            onMessage?(.playerDisconnected(player.gamePlayerID))
        }
    }
}
