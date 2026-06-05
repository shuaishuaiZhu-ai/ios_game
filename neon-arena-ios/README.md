# Neon Arena iOS

Neon Arena is a Swift/SpriteKit iOS MVP for short 2D arena battles.

The current implementation includes:

- Single-player mode against AI with easy, medium, and hard difficulty.
- Game Center entry points for online 1v1 duel and 3-4 player free-for-all.
- Standard rules with melee and ranged weapon pickups.
- Melee-only rules with punch, flying kick, and throw.
- Three maps with different wall layouts and weapon spawn patterns.
- A three-phase shrinking safe zone that damages players outside the circle.
- A pure `NeonArenaCore` Swift package for deterministic game-rule tests.

## Project Layout

- `Package.swift` - Swift package for `NeonArenaCore` and unit tests.
- `Sources/NeonArenaCore/` - platform-independent game rules, maps, AI, and network message contracts.
- `App/` - SwiftUI, SpriteKit, and GameKit iOS app layer.
- `Tests/NeonArenaCoreTests/` - unit tests for the MVP rules.
- `NeonArena.xcodeproj/` - iOS app project wrapper for Xcode.

## Gameplay

Standard mode uses weapon pickups. Melee weapons deal more damage at short range; ranged weapons deal less damage, fire projectiles, and are blocked by walls.

Melee-only mode disables weapon pickups and projectiles. Players can punch, flying kick, and throw.

All modes use the shrinking safe zone. The zone has three phases and applies continuous damage outside the circle to prevent endless running.

## Visual Direction

The first implementation uses the recommended neon sci-fi direction:

1. Ion Circuit - high-contrast cyan and magenta arena lines, clean player silhouettes, bright projectile readability.
2. Foundry Glow - darker industrial lanes, hot pink melee pickups, yellow ranged pickups.
3. Skyline Ruins - cooler open-space arena with broken cover and stronger safe-zone presence.

The SpriteKit scene implements the Ion Circuit direction first. The other two directions are captured as map themes and can be expanded with generated image assets later.

## Verification

GitHub Actions can run the real macOS/Xcode verification without a local Mac. The repository includes `.github/workflows/neon-arena-ios-ci.yml`, which runs on `macos-latest` when this subproject or the workflow file changes.

On a machine with Swift installed:

```powershell
swift test
```

On macOS with Xcode installed:

```powershell
xcodebuild -project NeonArena.xcodeproj -scheme NeonArena -destination "platform=iOS Simulator,name=iPhone 15" build
```

Game Center multiplayer requires separate Game Center-capable devices or simulator accounts and a configured bundle identifier/team before production testing.
