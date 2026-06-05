import Foundation

public enum NetworkMessage: Codable, Equatable, Sendable {
    case input(PlayerInput)
    case snapshot(MatchSnapshot)
    case playerReady(String)
    case playerDisconnected(String)
}

public protocol NetworkSession: AnyObject {
    var localPlayerID: String { get }
    var connectedPlayerIDs: [String] { get }
    func send(_ message: NetworkMessage) throws
}

public final class MockNetworkSession: NetworkSession {
    public let localPlayerID: String
    public private(set) var connectedPlayerIDs: [String]
    public private(set) var sentMessages: [NetworkMessage]

    public init(localPlayerID: String, connectedPlayerIDs: [String]) {
        self.localPlayerID = localPlayerID
        self.connectedPlayerIDs = connectedPlayerIDs
        self.sentMessages = []
    }

    public func send(_ message: NetworkMessage) throws {
        sentMessages.append(message)
    }

    public func receiveSnapshot(_ snapshot: MatchSnapshot) {
        sentMessages.append(.snapshot(snapshot))
    }
}
