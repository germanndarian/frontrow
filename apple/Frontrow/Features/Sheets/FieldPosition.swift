import SwiftUI
import UIKit

/// Where the ball is, drawn the way a broadcast draws it: the away team's
/// endzone on the left, the home team's on the right, the line of scrimmage
/// in blue and the chains in yellow, with the down and distance underneath.
///
/// Every position it draws comes from the scoreboard the Scores tab already
/// polls, so the lines slide across when that refreshes and never move on
/// their own.
struct FieldPosition: View {
    let game: Game
    let field: FieldSituation

    /// A field is 120 yards by 53⅓. A graphic this small squashes it so the
    /// yard numbers stay legible on a phone, which is what the broadcasts do.
    private static let aspect: CGFloat = 3.4
    /// Each endzone is 10 of the 120 yards drawn.
    private static let endzoneShare: CGFloat = 10.0 / 120.0

    var body: some View {
        VStack(spacing: 0) {
            turf
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(14)
            if headline != nil || lastPlay != nil {
                strip
            }
        }
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(spoken)
    }

    // ── The field ────────────────────────────────────────────────────────

    private var turf: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let endzoneWidth = w * Self.endzoneShare
            let surface = w - endzoneWidth * 2
            // A position on the playing surface, 0 at the away goal line.
            let x: (Double) -> CGFloat = { endzoneWidth + surface * CGFloat($0 / 100) }

            ZStack(alignment: .topLeading) {
                Rectangle().fill(Field.turf)

                if field.inRedZone, let attacking = attackedEnd {
                    Rectangle()
                        .fill(Field.redZone)
                        .frame(width: surface * 0.2, height: h)
                        .position(x: x(attacking ? 90 : 10), y: h / 2)
                }

                yardLines(x: x, height: h)
                hashMarks(x: x, height: h)
                numbers(x: x, height: h)

                if let first = field.firstDown, field.hasBall {
                    chalk(Field.chains, at: x(first), height: h)
                }
                if let ball = field.ballOn {
                    chalk(Field.scrimmage, at: x(ball), height: h)
                    ballMark(at: x(ball), height: h)
                }

                endzone(for: game.away, label: game.away.abbreviation, rotation: .degrees(-90))
                    .frame(width: endzoneWidth, height: h)
                endzone(for: game.home, label: game.home.abbreviation, rotation: .degrees(90))
                    .frame(width: endzoneWidth, height: h)
                    .position(x: w - endzoneWidth / 2, y: h / 2)
            }
            .frame(width: w, height: h)
        }
        .aspectRatio(Self.aspect, contentMode: .fit)
        // Poll to poll the ball moves a few yards; slide it rather than jump.
        .animation(.smooth(duration: 0.45), value: field)
    }

    /// Ten-yard lines, with the goal lines picked out.
    private func yardLines(x: @escaping (Double) -> CGFloat, height: CGFloat) -> some View {
        ForEach(0...10, id: \.self) { step in
            let goalLine = step == 0 || step == 10
            Rectangle()
                .fill(Color.white.opacity(goalLine ? 0.85 : 0.3))
                .frame(width: goalLine ? 1.5 : 1, height: height)
                .position(x: x(Double(step) * 10), y: height / 2)
        }
    }

    /// The two inner rows of ticks, at the same weight as the app's hairlines.
    private func hashMarks(x: @escaping (Double) -> CGFloat, height: CGFloat) -> some View {
        ForEach(1..<20, id: \.self) { step in
            let at = x(Double(step) * 5)
            ForEach([0.38, 0.62], id: \.self) { row in
                Rectangle()
                    .fill(Color.white.opacity(0.22))
                    .frame(width: 1, height: height * 0.07)
                    .position(x: at, y: height * row)
            }
        }
    }

    /// 10–50–10 up both sidelines: each number is the distance to the nearer
    /// goal line, which is how a field is painted.
    private func numbers(x: @escaping (Double) -> CGFloat, height: CGFloat) -> some View {
        ForEach(1..<10, id: \.self) { step in
            let yard = Double(step) * 10
            let label = Int(min(yard, 100 - yard))
            ForEach([0.21, 0.79], id: \.self) { row in
                Text("\(label)")
                    .font(.system(size: height * 0.17, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.75))
                    .position(x: x(yard), y: height * row)
            }
        }
    }

    private func chalk(_ color: Color, at x: CGFloat, height: CGFloat) -> some View {
        Rectangle()
            .fill(color)
            .frame(width: 2, height: height)
            .position(x: x, y: height / 2)
    }

    /// The ball sits just behind the scrimmage line, on the side the offense
    /// is driving from.
    private func ballMark(at x: CGFloat, height: CGFloat) -> some View {
        let behind: CGFloat = (attackedEnd ?? true) ? -7 : 7
        return Image(systemName: "football.fill")
            .font(.system(size: height * 0.2))
            .foregroundStyle(.white)
            .shadow(color: .black.opacity(0.35), radius: 1, y: 0.5)
            .position(x: x + behind, y: height / 2)
            .opacity(field.homeHasBall == nil ? 0 : 1)
    }

    private func endzone(for side: GameSide, label: String, rotation: Angle) -> some View {
        let style = EndzoneStyle(hex: side.color)
        return ZStack {
            Rectangle().fill(style.fill)
            GeometryReader { geo in
                Text(label)
                    .font(.system(size: min(geo.size.width * 0.55, 15), weight: .heavy))
                    .foregroundStyle(style.label)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .frame(width: geo.size.height)
                    .rotationEffect(rotation)
                    .frame(width: geo.size.width, height: geo.size.height)
            }
        }
    }

    /// True when the offense is driving towards the high end of the field —
    /// the away team's direction. Nil when the feed didn't name a side.
    private var attackedEnd: Bool? {
        field.homeHasBall.map { !$0 }
    }

    // ── Down, distance and the last thing that happened ──────────────────

    private var strip: some View {
        VStack(alignment: .leading, spacing: 5) {
            if let headline {
                Text(headline)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Theme.ink)
            }
            if let lastPlay {
                Text(lastPlay)
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }
    }

    private var headline: String? { field.headline }

    /// "(09:40) M.Reed rush middle…" — college feeds open with the clock, the
    /// NFL's don't, so put the game clock in front when it's missing.
    private var lastPlay: String? {
        guard let text = game.lastPlay?.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty else { return nil }
        guard !text.hasPrefix("(") else { return "Last play: \(text)" }
        guard let clock = game.period, !clock.isEmpty else { return "Last play: \(text)" }
        return "Last play: \(clock) · \(text)"
    }

    private var spoken: String {
        let said = [headline, lastPlay].compactMap { $0 }.joined(separator: ". ")
        return said.isEmpty ? "Field position" : said
    }
}

/// An endzone's fill and the label on top of it. The team colour wins unless
/// it can't carry a readable label, in which case the app's own surface does —
/// a washed-out abbreviation is worse than a neutral endzone.
struct EndzoneStyle {
    let fill: Color
    let label: Color

    /// WCAG's floor for large text. An abbreviation this size is large text.
    private static let minimumContrast = 3.0

    init(hex: String) {
        guard let rgb = EndzoneStyle.rgb(hex) else {
            self.fill = Theme.surface2
            self.label = Theme.ink
            return
        }
        let luminance = EndzoneStyle.luminance(rgb)
        let onWhite = EndzoneStyle.contrast(luminance, 1.0)
        let onBlack = EndzoneStyle.contrast(luminance, 0.0)
        guard max(onWhite, onBlack) >= EndzoneStyle.minimumContrast else {
            self.fill = Theme.surface2
            self.label = Theme.ink
            return
        }
        self.fill = Color(red: rgb.0, green: rgb.1, blue: rgb.2)
        self.label = onWhite >= onBlack ? .white : Color(hex: 0x131313)
    }

    private static func rgb(_ hex: String) -> (Double, Double, Double)? {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        return (
            Double((v >> 16) & 0xFF) / 255,
            Double((v >> 8) & 0xFF) / 255,
            Double(v & 0xFF) / 255
        )
    }

    private static func luminance(_ rgb: (Double, Double, Double)) -> Double {
        func channel(_ c: Double) -> Double {
            c <= 0.03928 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(rgb.0) + 0.7152 * channel(rgb.1) + 0.0722 * channel(rgb.2)
    }

    private static func contrast(_ a: Double, _ b: Double) -> Double {
        let (hi, lo) = a > b ? (a, b) : (b, a)
        return (hi + 0.05) / (lo + 0.05)
    }
}

/// The graphic's own palette. Turf and chalk belong to this drawing rather
/// than to the app's surfaces, so they live with it.
private enum Field {
    static let turf = dynamic(light: 0x3D8B57, dark: 0x235339)
    static let redZone = Color.white.opacity(0.13)
    static let scrimmage = Color(hex: 0x2F6BFF)
    static let chains = Color(hex: 0xF7C948)

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}
