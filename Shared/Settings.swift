import Foundation

enum Settings {
    static let appGroup = "group.com.mxttbennett.MapsRedirect"
    private static let enabledKey = "enabled"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    static var isEnabled: Bool {
        get { defaults.object(forKey: enabledKey) as? Bool ?? true }
        set { defaults.set(newValue, forKey: enabledKey) }
    }
}
