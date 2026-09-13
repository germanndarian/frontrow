import SwiftUI
import WidgetKit

/// The runners, drawn the way a scoreboard draws them: second base at the
/// top, third to the left, first to the right, with home plate implied where
/// the batter is standing. A filled base has someone on it.
struct BaseDiamond: View {
    let onFirst: Bool
    let onSecond: Bool
    let onThird: Bool
    var size: CGFloat = 34
    var tint: Color = .white

    var body: some View {
        // A square turned 45° is √2 times as wide as its side, so the centres
        // have to sit a little further apart than the side length or the three
        // bases overlap into one shape.
        let base = size * 0.26
        let reach = size * 0.33
        ZStack {
            corner(occupied: onSecond, side: base).offset(y: -reach)
            corner(occupied: onThird, side: base).offset(x: -reach)
            corner(occupied: onFirst, side: base).offset(x: reach)
        }
        .frame(width: size, height: size * 0.72)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(spoken)
    }

    private func corner(occupied: Bool, side: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: side * 0.18, style: .continuous)
            .fill(occupied ? tint : .clear)
            .overlay {
                RoundedRectangle(cornerRadius: side * 0.18, style: .continuous)
                    .stroke(tint.opacity(occupied ? 1 : 0.45), lineWidth: 1.2)
            }
            .frame(width: side, height: side)
            .rotationEffect(.degrees(45))
    }

    private var spoken: String {
        let on = [onFirst ? "first" : nil, onSecond ? "second" : nil, onThird ? "third" : nil]
            .compactMap { $0 }
        if on.count == 3 { return "Bases loaded" }
        return on.isEmpty ? "Bases empty" : "Runners on \(on.joined(separator: " and "))"
    }
}

/// One side of the scoreline: the abbreviation in the team's colour, and the
/// runs or points beside it.
struct ActivitySide: View {
    let abbr: String
    let score: Int
    let color: String
    let hasBall: Bool
    var compact = false

    var body: some View {
        HStack(spacing: compact ? 5 : 8) {
            Text(abbr)
                .font(.system(size: compact ? 12 : 13, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, compact ? 5 : 7)
                .padding(.vertical, compact ? 2 : 3)
                .background(Color(cssHex: color) ?? .gray, in: Capsule())
                .overlay(alignment: .topTrailing) {
                    // The ball sits with whoever has it, the way a broadcast
                    // bug marks possession.
                    if hasBall {
                        Circle()
                            .fill(.orange)
                            .frame(width: 5, height: 5)
                            .offset(x: 2, y: -1)
                    }
                }
            Text("\(score)")
                .font(.system(size: compact ? 16 : 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .monospacedDigit()
        }
    }
}

/// What sits between the two scores: the diamond for baseball, the down and
/// distance for football.
struct ActivityMiddle: View {
    let state: GameActivity.ContentState
    var compact = false

    var body: some View {
        VStack(spacing: compact ? 2 : 4) {
            Text(state.status)
                .font(.system(size: compact ? 10 : 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.75))
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            if state.isBaseball {
                BaseDiamond(
                    onFirst: state.onFirst ?? false,
                    onSecond: state.onSecond ?? false,
                    onThird: state.onThird ?? false,
                    size: compact ? 26 : 34
                )
                if let count = state.countLine {
                    Text(count)
                        .font(.system(size: compact ? 9.5 : 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.75))
                        .monospacedDigit()
                        .lineLimit(1)
                }
            } else if let down = state.downDistance {
                Text(down)
                    .font(.system(size: compact ? 10.5 : 12.5, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

/// The Lock Screen card, and the same content the expanded Dynamic Island
/// shows.
struct GameActivityView: View {
    let attributes: GameActivity
    let state: GameActivity.ContentState

    var body: some View {
        VStack(spacing: 10) {
            HStack(alignment: .center) {
                ActivitySide(
                    abbr: attributes.awayAbbr,
                    score: state.awayScore,
                    color: attributes.awayColor,
                    hasBall: state.homeHasBall == false
                )
                Spacer(minLength: 8)
                ActivityMiddle(state: state)
                Spacer(minLength: 8)
                ActivitySide(
                    abbr: attributes.homeAbbr,
                    score: state.homeScore,
                    color: attributes.homeColor,
                    hasBall: state.homeHasBall == true
                )
            }

            if let footer {
                Divider().overlay(.white.opacity(0.15))
                Text(footer)
                    .font(.system(size: 10.5))
                    .foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(14)
    }

    /// Who's pitching and hitting, or the league when there's nobody to name.
    private var footer: String? {
        if let pitcher = state.pitcher, let batter = state.batter {
            return "P: \(pitcher)   ·   AB: \(batter)"
        }
        return state.final ? "Final · \(attributes.leagueName)" : attributes.leagueName
    }
}
