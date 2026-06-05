import GameKit
import SwiftUI

struct ActiveMatch: Identifiable {
    let id = UUID()
    var title: String
    var config: MatchConfig
    var map: MapDefinition
    var playerIDs: [String]
    var localPlayerID: String
    var match: GKMatch?
}

struct PendingMatch: Identifiable {
    let id = UUID()
    var minPlayers: Int
    var maxPlayers: Int
    var title: String
    var mode: GameMode
}

struct ContentView: View {
    @StateObject private var gameCenter = GameCenterService()
    @State private var selectedDifficulty = Difficulty.medium
    @State private var selectedRuleset = Ruleset.standard
    @State private var selectedMapID = ArenaMaps.neonGrid.id
    @State private var activeMatch: ActiveMatch?
    @State private var pendingMatch: PendingMatch?

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.02, green: 0.02, blue: 0.07), Color(red: 0.05, green: 0.13, blue: 0.20)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 22) {
                    header
                    selectors
                    modeButtons
                    Spacer()
                    Text(gameCenter.statusText)
                        .font(.footnote)
                        .foregroundStyle(.cyan.opacity(0.8))
                }
                .padding(24)
            }
            .foregroundStyle(.white)
            .fullScreenCover(item: $activeMatch) { match in
                GameView(match: match)
            }
            .sheet(item: $pendingMatch) { pending in
                MatchmakerView(minPlayers: pending.minPlayers, maxPlayers: pending.maxPlayers) { match in
                    startOnlineMatch(pending: pending, match: match)
                    pendingMatch = nil
                } onCancel: {
                    pendingMatch = nil
                }
            }
            .onAppear {
                gameCenter.authenticate()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Neon Arena")
                .font(.system(size: 42, weight: .black, design: .rounded))
            Text("2D arena battles with cover, pickups, melee-only brawls, and a shrinking safe zone.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.72))
        }
    }

    private var selectors: some View {
        VStack(spacing: 14) {
            Picker("Map", selection: $selectedMapID) {
                ForEach(ArenaMaps.all, id: \.id) { map in
                    Text(map.name).tag(map.id)
                }
            }
            Picker("Rules", selection: $selectedRuleset) {
                Text("Standard").tag(Ruleset.standard)
                Text("Melee Only").tag(Ruleset.meleeOnly)
            }
            Picker("AI", selection: $selectedDifficulty) {
                Text("Easy").tag(Difficulty.easy)
                Text("Medium").tag(Difficulty.medium)
                Text("Hard").tag(Difficulty.hard)
            }
        }
        .pickerStyle(.segmented)
        .tint(.cyan)
    }

    private var modeButtons: some View {
        VStack(spacing: 12) {
            NeonButton(title: "Single Player", subtitle: "Fight AI with selected difficulty") {
                startSinglePlayer()
            }
            NeonButton(title: "Online Duel", subtitle: "Game Center 1v1") {
                requestOnlineMatch(minPlayers: 2, maxPlayers: 2, title: "Online Duel", mode: .onlineDuel(ruleset: selectedRuleset))
            }
            NeonButton(title: "Online FFA", subtitle: "Game Center 3-4 player free-for-all") {
                requestOnlineMatch(minPlayers: 3, maxPlayers: 4, title: "Online FFA", mode: .onlineFFA(ruleset: selectedRuleset))
            }
        }
    }

    private func startSinglePlayer() {
        let map = ArenaMaps.map(id: selectedMapID) ?? ArenaMaps.neonGrid
        let config = MatchConfig(
            mode: .single(difficulty: selectedDifficulty, ruleset: selectedRuleset),
            mapID: map.id,
            playerCount: 2
        )

        activeMatch = ActiveMatch(
            title: "Single Player",
            config: config,
            map: map,
            playerIDs: ["local", "bot-1"],
            localPlayerID: "local",
            match: nil
        )
    }

    private func requestOnlineMatch(minPlayers: Int, maxPlayers: Int, title: String, mode: GameMode) {
        if !gameCenter.isAuthenticated {
            gameCenter.authenticate()
        }
        pendingMatch = PendingMatch(minPlayers: minPlayers, maxPlayers: maxPlayers, title: title, mode: mode)
    }

    private func startOnlineMatch(pending: PendingMatch, match: GKMatch) {
        let map = ArenaMaps.map(id: selectedMapID) ?? ArenaMaps.neonGrid
        let localID = GKLocalPlayer.local.gamePlayerID
        let remoteIDs = match.players.map(\.gamePlayerID)
        let allIDs = ([localID] + remoteIDs).prefix(pending.maxPlayers).map { $0 }
        let config = MatchConfig(mode: pending.mode, mapID: map.id, playerCount: allIDs.count)

        activeMatch = ActiveMatch(
            title: pending.title,
            config: config,
            map: map,
            playerIDs: allIDs,
            localPlayerID: localID,
            match: match
        )
    }
}

struct NeonButton: View {
    var title: String
    var subtitle: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.64))
                }
                Spacer()
                Image(systemName: "play.fill")
                    .foregroundStyle(.cyan)
            }
            .padding(16)
            .background(.white.opacity(0.08))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(.cyan.opacity(0.35), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
