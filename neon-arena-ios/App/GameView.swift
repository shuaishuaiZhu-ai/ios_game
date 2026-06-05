import SpriteKit
import SwiftUI

final class ArenaInputModel: ObservableObject {
    @Published var movement = Vector2.zero
    @Published var aim = Vector2(x: 1, y: 0)
    @Published var firePressed = false
    @Published var meleeAction: MeleeAction?
}

struct GameView: View {
    let match: ActiveMatch
    @Environment(\.dismiss) private var dismiss
    @StateObject private var input = ArenaInputModel()
    @State private var scene: ArenaScene?

    var body: some View {
        ZStack {
            if let scene {
                SpriteView(scene: scene)
                    .ignoresSafeArea()
            }

            ControlOverlay(ruleset: match.config.mode.ruleset, input: input)

            VStack {
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(width: 42, height: 42)
                            .background(.black.opacity(0.32))
                            .clipShape(Circle())
                    }
                    .padding(18)
                    Spacer()
                }
                Spacer()
            }
        }
        .background(Color.black)
        .onAppear {
            guard scene == nil else { return }
            let arenaScene = ArenaScene(match: match, input: input)
            arenaScene.scaleMode = .aspectFit
            scene = arenaScene
        }
    }
}

struct ControlOverlay: View {
    var ruleset: Ruleset
    @ObservedObject var input: ArenaInputModel

    var body: some View {
        VStack {
            Spacer()
            HStack(alignment: .bottom) {
                Joystick(label: "Move") { vector in
                    input.movement = vector
                }
                Spacer()
                actionButtons
            }
            .padding(24)
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 12) {
            if ruleset == .standard {
                ActionButton(title: "Fire") { pressed in
                    input.firePressed = pressed
                    if !pressed {
                        input.meleeAction = nil
                    }
                }
                ActionButton(title: "Punch") { pressed in
                    input.meleeAction = pressed ? .punch : nil
                }
            } else {
                ActionButton(title: "Punch") { pressed in input.meleeAction = pressed ? .punch : nil }
                ActionButton(title: "Kick") { pressed in input.meleeAction = pressed ? .flyingKick : nil }
                ActionButton(title: "Throw") { pressed in input.meleeAction = pressed ? .throw : nil }
            }
        }
    }
}

struct Joystick: View {
    var label: String
    var onChange: (Vector2) -> Void
    @State private var offset = CGSize.zero

    var body: some View {
        ZStack {
            Circle()
                .fill(.black.opacity(0.28))
                .overlay(Circle().stroke(.cyan.opacity(0.45), lineWidth: 2))
                .frame(width: 124, height: 124)
            Circle()
                .fill(.cyan.opacity(0.7))
                .frame(width: 54, height: 54)
                .offset(offset)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.7))
                .offset(y: 82)
        }
        .gesture(
            DragGesture()
                .onChanged { value in
                    let clamped = clamp(value.translation, limit: 44)
                    offset = clamped
                    onChange(Vector2(x: clamped.width / 44, y: -clamped.height / 44))
                }
                .onEnded { _ in
                    offset = .zero
                    onChange(.zero)
                }
        )
    }

    private func clamp(_ size: CGSize, limit: CGFloat) -> CGSize {
        let length = sqrt(size.width * size.width + size.height * size.height)
        guard length > limit else { return size }
        let scale = limit / length
        return CGSize(width: size.width * scale, height: size.height * scale)
    }
}

struct ActionButton: View {
    var title: String
    var onPress: (Bool) -> Void

    var body: some View {
        Text(title)
            .font(.caption.weight(.bold))
            .foregroundStyle(.white)
            .frame(width: 78, height: 46)
            .background(.pink.opacity(0.72))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(.white.opacity(0.28), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in onPress(true) }
                    .onEnded { _ in onPress(false) }
            )
    }
}
