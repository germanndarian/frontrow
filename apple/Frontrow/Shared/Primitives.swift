import SwiftUI

/// The small pieces the screens share: section rules, eyebrows, panels, stat
/// tiles and the bar chart. Same shapes and weights as the website's.
struct SectionRule: View {
    let title: String
    var detail: String? = nil
    var accent: Color? = nil

    var body: some View {
        HStack(spacing: 10) {
            Text(title)
                .font(.system(size: 13, weight: .black))
                .tracking(0.8)
                .foregroundStyle(Theme.ink)
            if let detail {
                Text(detail)
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(accent ?? Theme.faint)
            }
            Rectangle().fill(Theme.line).frame(height: 1)
        }
    }
}

struct Eyebrow: View {
    let text: String
    var size: CGFloat = 10.5

    init(_ text: String, size: CGFloat = 10.5) {
        self.text = text
        self.size = size
    }

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: size, weight: .semibold))
            .tracking(1.2)
            .foregroundStyle(Theme.faint)
    }
}

/// A surface card with the app's corner radius and hairline.
struct Panel<Content: View>: View {
    var radius: CGFloat = 20
    @ViewBuilder var content: Content

    var body: some View {
        content
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Theme.line, lineWidth: 1)
            }
    }
}

struct StatTile: View {
    let value: String
    let label: String
    var ink: Color? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(value)
                .font(.system(size: 18, weight: .semibold, design: .monospaced))
                .foregroundStyle(ink ?? Theme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Eyebrow(label, size: 10)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(Theme.background2.opacity(0.6), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 13, style: .continuous).stroke(Theme.lineSoft, lineWidth: 1)
        }
    }
}

/// Each bar's height is its share of the tallest, with a floor so a zero
/// still reads as a bar.
struct Bars: View {
    let values: [Int]
    let color: Color
    var height: CGFloat = 32
    var gap: CGFloat = 3
    var radius: CGFloat = 2

    var body: some View {
        let top = max(values.max() ?? 1, 1)
        HStack(alignment: .bottom, spacing: gap) {
            ForEach(Array(values.enumerated()), id: \.offset) { _, v in
                RoundedRectangle(cornerRadius: radius)
                    .fill(color)
                    .frame(maxWidth: .infinity)
                    .frame(height: max(height * 0.06, height * CGFloat(v) / CGFloat(top)))
            }
        }
        .frame(height: height, alignment: .bottom)
        .accessibilityHidden(true)
    }
}

/// W / L / T in the league's colours.
struct OutcomeMark: View {
    let result: Outcome
    var size: CGFloat = 12

    var body: some View {
        Text(result.rawValue)
            .font(.system(size: size, weight: .bold, design: .monospaced))
            .foregroundStyle(color)
    }

    private var color: Color {
        switch result {
        case .win: Theme.win
        case .loss: Theme.loss
        case .tie: Theme.muted
        }
    }
}

/// A player's headshot over their team colour, with initials while it loads.
struct Headshot: View {
    let url: String
    let name: String
    let color: String
    var size: CGFloat = 56

    var body: some View {
        AsyncImage(url: URL(string: url)) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Text(initials)
                    .font(.system(size: size * 0.34, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .frame(width: size, height: size)
        .background(Color(cssHex: color) ?? Theme.faint)
        .clipShape(Circle())
        .overlay { Circle().stroke(Theme.line, lineWidth: 1) }
    }

    private var initials: String {
        name.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined()
    }
}

/// A shimmering block standing in for content that hasn't landed yet.
struct SkeletonBlock: View {
    var height: CGFloat
    var radius: CGFloat = 14

    var body: some View {
        RoundedRectangle(cornerRadius: radius, style: .continuous)
            .fill(Theme.surface2)
            .frame(height: height)
            .shimmering()
            .accessibilityHidden(true)
    }
}

/// A card-shaped placeholder, so the eye lands where the card will.
struct CardSkeleton: View {
    var height: CGFloat = 150

    var body: some View {
        Panel {
            SkeletonBlock(height: height, radius: 20)
        }
        .accessibilityHidden(true)
    }
}

/// Retry affordance shared by every failed state.
struct FailedState: View {
    let title: String
    let message: String
    let retry: () -> Void

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: "wifi.exclamationmark")
        } description: {
            Text(message)
        } actions: {
            Button("Try again", action: retry).buttonStyle(.glass)
        }
    }
}

/// A glass filter chip. Selected chips take the accent tint.
struct Chip: View {
    let label: String
    let on: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 15)
                .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
        .foregroundStyle(on ? Color.white : Theme.muted)
        .glassEffect(on ? .regular.tint(Theme.accent).interactive() : .regular.interactive())
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// A scrolling row of chips in one glass container, so neighbouring
/// highlights blend the way Apple's do.
struct ChipRow<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            GlassEffectContainer(spacing: 8) {
                HStack(spacing: 8) { content }
            }
            .padding(.vertical, 6)
        }
        .scrollClipDisabled()
    }
}

/// The week picker above the scoreboard: last week, this week, and the season
/// ahead. The chosen week is kept in view as the strip scrolls.
struct WeekStrip: View {
    let weeks: [WeekWindow]
    let selected: WeekWindow
    let choose: (WeekWindow) -> Void

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                GlassEffectContainer(spacing: 8) {
                    HStack(spacing: 8) {
                        ForEach(weeks) { week in
                            Chip(label: week.label, on: week == selected) { choose(week) }
                                .id(week.offset)
                        }
                    }
                }
                .padding(.vertical, 6)
            }
            .scrollClipDisabled()
            .onAppear { proxy.scrollTo(selected.offset, anchor: .center) }
            .onChange(of: selected) { _, week in
                withAnimation(.snappy(duration: 0.25)) { proxy.scrollTo(week.offset, anchor: .center) }
            }
        }
        .accessibilityLabel("Week")
    }
}

/// A filled button that answers the touch before the work starts — the press
/// is what makes a tap feel immediate, whatever happens next.
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.snappy(duration: 0.12), value: configuration.isPressed)
    }
}

/// A full-width row that highlights while it's held, the way a list row does.
struct RowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(configuration.isPressed ? Theme.background2.opacity(0.7) : .clear)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
