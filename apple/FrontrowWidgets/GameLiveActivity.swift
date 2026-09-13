import ActivityKit
import SwiftUI
import WidgetKit

/// The live game tracker: a card on the Lock Screen, and the same game in the
/// Dynamic Island at three sizes.
///
/// The island has to say something useful at a glance in a space the width of
/// a word, so it narrows by stages: expanded shows the whole scoreline with
/// the diamond, compact shows each side's abbreviation and score, and minimal
/// — which is what you get when another app is sharing the island — shows the
/// score alone.
struct GameLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GameActivity.self) { context in
            GameActivityView(attributes: context.attributes, state: context.state)
                .activityBackgroundTint(Color.black.opacity(0.55))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    ActivitySide(
                        abbr: context.attributes.awayAbbr,
                        score: context.state.awayScore,
                        color: context.attributes.awayColor,
                        hasBall: context.state.homeHasBall == false,
                        compact: true
                    )
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ActivitySide(
                        abbr: context.attributes.homeAbbr,
                        score: context.state.homeScore,
                        color: context.attributes.homeColor,
                        hasBall: context.state.homeHasBall == true,
                        compact: true
                    )
                    .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    ActivityMiddle(state: context.state, compact: true)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let footer = expandedFooter(context.state) {
                        Text(footer)
                            .font(.system(size: 10.5))
                            .foregroundStyle(.white.opacity(0.6))
                            .lineLimit(1)
                    }
                }
            } compactLeading: {
                Text("\(context.state.awayScore)")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color(cssHex: context.attributes.awayColor) ?? .white)
            } compactTrailing: {
                HStack(spacing: 3) {
                    // Baseball's outs are the one thing that fits out here and
                    // is worth the space; football gets the clock instead.
                    if context.state.isBaseball, let outs = context.state.outs {
                        OutPips(outs: outs)
                    }
                    Text("\(context.state.homeScore)")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(Color(cssHex: context.attributes.homeColor) ?? .white)
                }
            } minimal: {
                Text("\(max(context.state.awayScore, context.state.homeScore))")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
            }
            .widgetURL(DeepLink.game(context.attributes.gameId))
            .keylineTint(Color(cssHex: context.attributes.homeColor) ?? .white)
        }
    }

    private func expandedFooter(_ state: GameActivity.ContentState) -> String? {
        if let pitcher = state.pitcher, let batter = state.batter {
            return "P: \(pitcher)   ·   AB: \(batter)"
        }
        return state.downDistance
    }
}

/// Outs as pips, which reads faster than a number in a space this small.
struct OutPips: View {
    let outs: Int

    var body: some View {
        HStack(spacing: 1.5) {
            ForEach(0..<2, id: \.self) { index in
                Circle()
                    .fill(index < outs ? Color.yellow : Color.white.opacity(0.3))
                    .frame(width: 4, height: 4)
            }
        }
        .accessibilityLabel("\(outs) out\(outs == 1 ? "" : "s")")
    }
}
