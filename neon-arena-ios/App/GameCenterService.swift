import GameKit
import SwiftUI
import UIKit

@MainActor
final class GameCenterService: ObservableObject {
    @Published private(set) var isAuthenticated = false
    @Published private(set) var statusText = "Game Center not authenticated"

    func authenticate() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
            Task { @MainActor in
                if let viewController {
                    Self.present(viewController)
                    return
                }

                if let error {
                    self?.statusText = "Game Center error: \(error.localizedDescription)"
                } else {
                    self?.isAuthenticated = GKLocalPlayer.local.isAuthenticated
                    self?.statusText = GKLocalPlayer.local.isAuthenticated
                        ? "Game Center: \(GKLocalPlayer.local.displayName)"
                        : "Game Center not authenticated"
                }
            }
        }
    }

    private static func present(_ viewController: UIViewController) {
        guard let root = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: { $0.isKeyWindow })?
            .rootViewController
        else {
            return
        }

        root.present(viewController, animated: true)
    }
}

struct MatchmakerView: UIViewControllerRepresentable {
    var minPlayers: Int
    var maxPlayers: Int
    var onMatch: (GKMatch) -> Void
    var onCancel: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onMatch: onMatch, onCancel: onCancel)
    }

    func makeUIViewController(context: Context) -> GKMatchmakerViewController {
        let request = GKMatchRequest()
        request.minPlayers = minPlayers
        request.maxPlayers = maxPlayers

        let controller = GKMatchmakerViewController(matchRequest: request)!
        controller.matchmakerDelegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: GKMatchmakerViewController, context: Context) {}

    final class Coordinator: NSObject, GKMatchmakerViewControllerDelegate {
        var onMatch: (GKMatch) -> Void
        var onCancel: () -> Void

        init(onMatch: @escaping (GKMatch) -> Void, onCancel: @escaping () -> Void) {
            self.onMatch = onMatch
            self.onCancel = onCancel
        }

        func matchmakerViewControllerWasCancelled(_ viewController: GKMatchmakerViewController) {
            viewController.dismiss(animated: true)
            onCancel()
        }

        func matchmakerViewController(_ viewController: GKMatchmakerViewController, didFailWithError error: Error) {
            viewController.dismiss(animated: true)
            onCancel()
        }

        func matchmakerViewController(_ viewController: GKMatchmakerViewController, didFind match: GKMatch) {
            viewController.dismiss(animated: true)
            onMatch(match)
        }
    }
}
