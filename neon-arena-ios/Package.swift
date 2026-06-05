// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "NeonArena",
    platforms: [
        .iOS(.v17),
        .macOS(.v13)
    ],
    products: [
        .library(name: "NeonArenaCore", targets: ["NeonArenaCore"])
    ],
    targets: [
        .target(
            name: "NeonArenaCore",
            path: "Sources/NeonArenaCore"
        ),
        .testTarget(
            name: "NeonArenaCoreTests",
            dependencies: ["NeonArenaCore"],
            path: "Tests/NeonArenaCoreTests"
        )
    ]
)
