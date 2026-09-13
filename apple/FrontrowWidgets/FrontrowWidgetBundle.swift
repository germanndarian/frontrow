import WidgetKit
import SwiftUI

@main
struct FrontrowWidgetBundle: WidgetBundle {
    var body: some Widget {
        ScoresWidget()
        LockScoreWidget()
        GameLiveActivity()
    }
}
