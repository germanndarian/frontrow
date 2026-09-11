import SwiftUI

/// One followed team: header tinted with the team colour, recent form,
/// what's next, the scoring stretch, and the sheet actions along the bottom.
struct TeamCardView: View {
    let follow: FollowedTeam
    let state: Loadable<TeamCard>
    let selected: Bool
    let onSelect: () -> Void
    let onSheet: (AppSheet) -> Void
    let onRetry: () -> Void

    var body: some View {
        switch state {
        case .loading:
            CardSkeleton(height: 196)
        case .failed(let message):
            Panel {
                VStack(spacing: 10) {
                    Text(follow.displayName)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.ink)
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(Theme.faint)
                        .multilineTextAlignment(.center)
                    Button("Try again", action: onRetry).buttonStyle(.glass)
                }
                .frame(maxWidth: .infinity)
                .padding(20)
            }
        case .loaded(let card):
            loaded(card)
        }
    }

    @ViewBuilder
    private func loaded(_ card: TeamCard) -> some View {
        VStack(spacing: 0) {
            header(card)
            body(card)
            actions(card)
        }
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(selected ? Theme.accent.opacity(0.6) : Theme.line, lineWidth: selected ? 1.5 : 1)
        }
        .shadow(color: .black.opacity(0.08), radius: 12, y: 6)
    }

    private func header(_ card: TeamCard) -> some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                TeamMark(logo: follow.logo, abbreviation: follow.abbreviation, color: follow.color, size: 46)
                VStack(alignment: .leading, spacing: 2) {
                    Text(follow.displayName)
                        .font(.system(size: 17.5, weight: .heavy))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Text(card.team.standingSummary)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(card.team.record.isEmpty ? follow.abbreviation : card.team.record)
                        .font(.system(size: 16, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.ink)
                    Text(follow.league.name)
                        .font(.system(size: 10.5))
                        .tracking(1)
                        .foregroundStyle(Theme.faint)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 17)
            .padding(.bottom, 15)
            .background(alignment: .leading) {
                LinearGradient(
                    colors: [(Color(cssHex: follow.color) ?? Theme.accent).opacity(0.22), .clear],
                    startPoint: .topLeading, endPoint: .trailing
                )
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
    }

    @ViewBuilder
    private func body(_ card: TeamCard) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Eyebrow("Recent form")
                .padding(.bottom, 8)
            FormChips(form: card.form)

            HStack(alignment: .top, spacing: 10) {
                tile {
                    Eyebrow("Next up", size: 10).padding(.bottom, 8)
                    if let next = card.next {
                        HStack(spacing: 8) {
                            TeamMark(logo: next.opponentLogo, abbreviation: next.opponentAbbr, color: "#8C8C86", size: 24)
                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(next.atVs) \(next.opponentAbbr)")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Theme.ink)
                                Text(next.startsAt.map(GameCard.when) ?? "")
                                    .font(.system(size: 11))
                                    .foregroundStyle(Theme.faint)
                                    .lineLimit(1)
                            }
                        }
                    } else {
                        Text("Nothing scheduled")
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(Theme.muted)
                    }
                }
                tile {
                    Eyebrow(card.scoring.isEmpty ? "Standing" : "\(follow.league.scoreNoun) · last \(card.scoring.count)", size: 10)
                        .padding(.bottom, 8)
                    if card.scoring.isEmpty {
                        Text(card.team.standingSummary.isEmpty ? "—" : card.team.standingSummary)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(Theme.muted)
                    } else {
                        Bars(values: card.scoring, color: Color(cssHex: follow.color) ?? Theme.accent)
                    }
                }
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .padding(.bottom, 16)
    }

    private func tile<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) { content() }
            .frame(maxWidth: .infinity, minHeight: 74, alignment: .topLeading)
            .padding(12)
            .background(Theme.background2.opacity(0.6), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.lineSoft, lineWidth: 1)
            }
    }

    /// The whole strip is the target, not the words in the middle of it: the
    /// label carries the size so the tap area is the full half of the card.
    private func actions(_ card: TeamCard) -> some View {
        HStack(spacing: 0) {
            if card.inPlayoffs == true {
                action("Playoff bracket", tint: Theme.accent) { onSheet(.bracket(follow)) }
                Divider().frame(height: 24).overlay(Theme.lineSoft)
            }
            action("Full schedule", tint: Theme.muted) { onSheet(.schedule(follow)) }
        }
        .overlay(alignment: .top) { Rectangle().fill(Theme.lineSoft).frame(height: 1) }
    }

    private func action(_ title: String, tint: Color, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            HStack(spacing: 5) {
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .bold))
                    .opacity(0.5)
            }
            .foregroundStyle(tint)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(RowButtonStyle())
    }
}

/// The last five results as coloured squares with the opponent underneath.
struct FormChips: View {
    let form: [FormEntry]

    var body: some View {
        if form.isEmpty {
            Text("No games logged yet.")
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.faint)
        } else {
            HStack(spacing: 6) {
                ForEach(form.prefix(5)) { entry in
                    VStack(spacing: 4) {
                        Text(entry.result.rawValue)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(tint(entry.result))
                            .frame(maxWidth: .infinity)
                            .frame(height: 30)
                            .background(tint(entry.result).opacity(0.14), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        Text("\(entry.atVs == "@" ? "@" : "")\(entry.opponentAbbr)")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(Theme.faint)
                            .lineLimit(1)
                    }
                }
            }
        }
    }

    private func tint(_ r: Outcome) -> Color {
        switch r {
        case .win: Theme.win
        case .loss: Theme.loss
        case .tie: Theme.muted
        }
    }
}
