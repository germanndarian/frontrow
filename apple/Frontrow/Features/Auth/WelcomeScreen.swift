import SwiftUI

/// The front door. Deliberately dark and branded whatever the theme, like the
/// website's marketing page — the floodlit night game.
struct WelcomeScreen: View {
    let onSignUp: () -> Void
    let onSignIn: () -> Void
    let onGoogle: () -> Void
    let onGuest: () -> Void

    private static let features = [
        ("01", "Live scores and play-by-play", "Period, clock, count and the last thing that happened."),
        ("02", "Season stats and standings", "Form, per-game splits, divisions and playoff brackets."),
        ("03", "Players you tune in for", "Game logs and league ranks for every name you star."),
    ]

    var body: some View {
        ZStack {
            Color(hex: 0x0F1622).ignoresSafeArea()
            RadialGradient(
                colors: [Color(hex: 0x3C82E6).opacity(0.42), .clear],
                center: .init(x: 0.12, y: -0.04), startRadius: 0, endRadius: 460
            )
            .ignoresSafeArea()
            RadialGradient(
                colors: [Color(hex: 0x7A5CE0).opacity(0.3), .clear],
                center: .init(x: 1.02, y: 0.08), startRadius: 0, endRadius: 420
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 9) {
                        Image(systemName: "sportscourt.fill")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(Color(hex: 0x7FA9F0))
                        Text("FRONT\(Text("ROW").foregroundStyle(Color(hex: 0x7FA9F0)))")
                            .font(.system(size: 17, weight: .black))
                            .tracking(-0.3)
                            .foregroundStyle(.white)
                    }
                    .padding(.top, 20)

                    Text("NEW · NFL · NBA · MLB · NHL · NCAAF")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(.horizontal, 11)
                        .padding(.vertical, 6)
                        .background(.white.opacity(0.1), in: Capsule())
                        .overlay { Capsule().stroke(.white.opacity(0.15), lineWidth: 1) }
                        .padding(.top, 40)

                    Text("Your teams.\nEvery game.\n\(Text("Front row seat.").italic().foregroundStyle(Color(hex: 0x7FA9F0)))")
                        .font(.system(size: 42, weight: .black))
                        .tracking(-1.4)
                        .foregroundStyle(.white)
                        .lineSpacing(-2)
                        .padding(.top, 20)

                    Text("Live scores, season stats and standings for only the teams you follow. Nothing else.")
                        .font(.system(size: 15))
                        .foregroundStyle(.white.opacity(0.6))
                        .padding(.top, 18)
                        .frame(maxWidth: 320, alignment: .leading)

                    VStack(spacing: 0) {
                        ForEach(Array(Self.features.enumerated()), id: \.element.0) { index, feature in
                            HStack(alignment: .top, spacing: 12) {
                                Text(feature.0)
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                                    .foregroundStyle(Color(hex: 0x7FA9F0))
                                    .frame(width: 26, height: 26)
                                    .background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(feature.1)
                                        .font(.system(size: 13.5, weight: .bold))
                                        .foregroundStyle(.white)
                                    Text(feature.2)
                                        .font(.system(size: 12))
                                        .foregroundStyle(.white.opacity(0.5))
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding(.vertical, 13)
                            .overlay(alignment: .top) {
                                if index > 0 { Rectangle().fill(.white.opacity(0.08)).frame(height: 1) }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(.white.opacity(0.1), lineWidth: 1)
                    }
                    .padding(.top, 30)

                    Text("Scores and stats via ESPN's public endpoints. Free, no ads, no account required to look around.")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.55))
                        .padding(.top, 22)

                    Color.clear.frame(height: 20)
                }
                .padding(.horizontal, 24)
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 10) {
                    Button(action: onSignUp) {
                        Text("Get started free")
                            .font(.system(size: 15, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .background(Theme.accent, in: Capsule())

                    Button(action: onGoogle) {
                        HStack(spacing: 9) {
                            GoogleMark()
                            Text("Continue with Google")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color(hex: 0x131313))
                    .background(.white, in: Capsule())

                    Button(action: onSignIn) {
                        Text("I already have an account")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .background(.white.opacity(0.08), in: Capsule())
                    .overlay { Capsule().stroke(.white.opacity(0.22), lineWidth: 1) }

                    Button("Look around as a guest", action: onGuest)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.55))
                        .padding(.top, 2)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 8)
                .background(
                    LinearGradient(
                        colors: [Color(hex: 0x0F1622).opacity(0), Color(hex: 0x0F1622).opacity(0.88), Color(hex: 0x0F1622)],
                        startPoint: .top, endPoint: .bottom
                    )
                )
            }
        }
        .preferredColorScheme(.dark)
    }
}
