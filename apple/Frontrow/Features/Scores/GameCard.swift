import SwiftUI

/// One game: league line and status, the two sides, and a footer with the
/// clock or start time on the left and context on the right.
struct GameCard: View {
    let game: Game
    let followed: Bool
    /// Held at the top of its league's list. Default off, so the sheets that
    /// show a card outside that list don't have to say so.
    var pinned = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                if followed {
                    Image(systemName: "star.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(Theme.accent)
                        .accessibilityLabel("Your team")
                }
                if pinned {
                    Image(systemName: "pin.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(Theme.gold)
                        .accessibilityLabel("Pinned")
                }
                Text(game.league.name)
                    .font(.system(size: 10.5, weight: .bold, design: .monospaced))
                    .tracking(1.4)
                    .foregroundStyle(Theme.faint)
                if let week = game.week {
                    Text("WEEK \(week)")
                        .font(.system(size: 9.5, weight: .bold, design: .monospaced))
                        .tracking(0.8)
                        .foregroundStyle(Theme.muted)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Theme.background2, in: Capsule())
                }
                Spacer(minLength: 4)
                Text(statusText)
                    .font(.system(size: 11, weight: .bold))
                    .tracking(0.8)
                    .foregroundStyle(statusColor)
            }
            .padding(.bottom, 14)

            side(game.away, lead: awayLeads)
                .padding(.bottom, 11)
            side(game.home, lead: !awayLeads)

            Divider().overlay(Theme.lineSoft).padding(.top, 14).padding(.bottom, 12)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(footLeft)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(game.state == .in ? Theme.live : Theme.ink)
                Spacer(minLength: 0)
                Text(footRight)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.faint)
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
        }
        .padding(16)
        .padding(.leading, followed ? 5 : 0)
        .background {
            let shape = RoundedRectangle(cornerRadius: 20, style: .continuous)
            shape.fill(Theme.surface)
            if followed { shape.fill(Theme.accent.opacity(0.08)) }
        }
        .overlay(alignment: .leading) {
            if followed { Rectangle().fill(Theme.accent).frame(width: 5) }
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(followed ? Theme.accent : Theme.line, lineWidth: followed ? 2 : 1)
        }
        .shadow(
            color: followed ? Theme.accent.opacity(0.22) : .black.opacity(0.08),
            radius: followed ? 14 : 12,
            y: 6
        )
        .accessibilityElement(children: .combine)
    }

    private var awayLeads: Bool {
        if game.state == .post { return game.away.winner }
        return (game.away.score ?? 0) > (game.home.score ?? 0)
    }

    @ViewBuilder
    private func side(_ s: GameSide, lead: Bool) -> some View {
        let dim = game.state == .post && !lead
        HStack(spacing: 12) {
            TeamMark(logo: s.logo, abbreviation: s.abbreviation, color: s.color, size: 34)
            VStack(alignment: .leading, spacing: 1) {
                Text(s.shortName.isEmpty ? s.displayName : s.shortName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(dim ? Theme.faint : Theme.ink)
                    .lineLimit(1)
                if let record = s.record, !record.isEmpty {
                    Text(record)
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.faint)
                }
            }
            Spacer(minLength: 8)
            Text(game.state == .pre ? "–" : "\(s.score ?? 0)")
                .font(.system(size: 27, weight: .semibold, design: .monospaced))
                .foregroundStyle(game.state == .in && lead ? Theme.accent : dim ? Theme.faint : Theme.ink)
                .contentTransition(.numericText())
        }
    }

    private var statusText: String {
        switch game.state {
        case .in: "● LIVE"
        case .pre: "SCHEDULED"
        case .post: "FINAL"
        }
    }

    private var statusColor: Color {
        switch game.state {
        case .in: Theme.live
        case .pre: Theme.muted
        case .post: Theme.faint
        }
    }

    private var footLeft: String {
        switch game.state {
        case .in: game.shortDetail.isEmpty ? "Live" : game.shortDetail
        case .pre: game.startsAt.map(Self.when) ?? ""
        case .post: game.shortDetail.isEmpty ? "Final" : game.shortDetail
        }
    }

    private var footRight: String {
        switch game.state {
        case .in:
            return game.lastPlay ?? game.situation ?? game.venue ?? ""
        case .pre:
            let parts = [game.odds?.details, game.odds?.overUnder.map { "O/U \($0.formatted())" }, game.broadcast].compactMap { $0 }
            return parts.isEmpty ? (game.venue ?? "") : parts.joined(separator: " · ")
        case .post:
            return game.venue ?? ""
        }
    }

    /// "Today · 8:20 PM", "Tomorrow · 1:05 PM", or "Sep 10 · 8:20 PM".
    static func when(_ date: Date) -> String {
        let time = date.formatted(date: .omitted, time: .shortened)
        if Calendar.current.isDateInToday(date) { return "Today · \(time)" }
        if Calendar.current.isDateInTomorrow(date) { return "Tomorrow · \(time)" }
        return "\(date.formatted(.dateTime.month(.abbreviated).day())) · \(time)"
    }
}

/// A team's logo, falling back to a coloured abbreviation tile while it loads
/// or if there is none — the same tile the web app draws.
struct TeamMark: View {
    let logo: String
    let abbreviation: String
    let color: String
    var size: CGFloat = 34

    var body: some View {
        AsyncImage(url: URL(string: logo)) { phase in
            if let image = phase.image {
                image.resizable().scaledToFit().padding(3)
            } else {
                Text(abbreviation)
                    .font(.system(size: size * 0.27, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
            }
        }
        .frame(width: size, height: size)
        .background(Color(cssHex: color) ?? Theme.faint, in: RoundedRectangle(cornerRadius: size * 0.29, style: .continuous))
    }
}

/// Shaped like a game card, shimmering, so the eye lands where the card will.
struct GameCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack { bar(34, 10); Spacer(); bar(64, 10) }.padding(.bottom, 14)
            ForEach(0..<2, id: \.self) { i in
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 10).fill(Theme.surface2).frame(width: 34, height: 34)
                    VStack(alignment: .leading, spacing: 6) { bar(140, 14); bar(70, 10) }
                    Spacer()
                    bar(22, 26)
                }
                .padding(.bottom, i == 0 ? 11 : 0)
            }
            Divider().overlay(Theme.lineSoft).padding(.top, 14).padding(.bottom, 12)
            HStack { bar(110, 11); Spacer(); bar(90, 11) }
        }
        .padding(16)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1) }
        .redacted(reason: .placeholder)
        .shimmering()
        .accessibilityHidden(true)
    }

    private func bar(_ w: CGFloat, _ h: CGFloat) -> some View {
        Capsule().fill(Theme.surface2).frame(width: w, height: h)
    }
}

/// A soft highlight sweeping across, like the web's skeleton shimmer.
struct Shimmer: ViewModifier {
    @State private var phase: CGFloat = -1

    func body(content: Content) -> some View {
        content
            .overlay {
                GeometryReader { geo in
                    LinearGradient(
                        colors: [.clear, Color.white.opacity(0.18), .clear],
                        startPoint: .leading, endPoint: .trailing
                    )
                    .frame(width: geo.size.width * 0.6)
                    .offset(x: phase * geo.size.width)
                }
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .allowsHitTesting(false)
            }
            .onAppear {
                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) { phase = 1.2 }
            }
    }
}

extension View {
    func shimmering() -> some View { modifier(Shimmer()) }
}
