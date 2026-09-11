import SwiftUI
import WidgetKit

/// The widgets at their real sizes, drawn from the same views the extension
/// ships. Reached with `-widget-gallery`, so a change to a widget can be
/// looked at without adding one to a home screen first.
struct WidgetGallery: View {
    let entry: ScoreEntry

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                tile("Small · 2×2", width: 170, height: 170) {
                    SmallWidget(entry: entry)
                }
                tile("Medium · 4×2", width: 364, height: 170) {
                    MediumWidget(entry: entry)
                }
                tile("Large · 4×4", width: 364, height: 382) {
                    LargeWidget(entry: entry)
                }
                Text("LOCK SCREEN")
                    .font(.system(size: 11, weight: .black))
                    .tracking(1.2)
                    .foregroundStyle(Theme.faint)
                    .padding(.top, 4)
                HStack(alignment: .top, spacing: 14) {
                    lockTile("Rectangular", width: 160, height: 72) {
                        LockRectangular(entry: entry)
                    }
                    lockTile("Circular", width: 72, height: 72) {
                        LockCircular(entry: entry)
                    }
                }
                lockTile("Inline", width: 250, height: 26) {
                    LockInline(entry: entry)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Theme.background)
    }

    private func tile<Content: View>(_ title: String, width: CGFloat, height: CGFloat, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.faint)
            content()
                .padding(16)
                .frame(width: width, height: height)
                .background { WidgetGround(accent: entry.accent) }
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .tint(entry.accent.color)
        }
    }

    private func lockTile<Content: View>(_ title: String, width: CGFloat, height: CGFloat, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.faint)
            content()
                .frame(width: width, height: height)
                .padding(8)
                .background(Color.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .environment(\.colorScheme, .dark)
                .foregroundStyle(.white)
        }
    }
}
