import SwiftUI

struct ContentView: View {
    @State private var isEnabled = Settings.isEnabled
    @Environment(\.openURL) private var openURL

    private let sampleLink = URL(string: "https://www.google.com/maps/search/?api=1&query=coffee")!

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Toggle("Open Google Maps links in Apple Maps", isOn: $isEnabled)
                        .onChange(of: isEnabled) { _, value in Settings.isEnabled = value }
                } footer: {
                    Text("Takes effect the next time you open a web page in Safari.")
                }

                Section("Turn on the extension") {
                    step(1, "Open Settings > Apps > Safari > Extensions (on iOS 17: Settings > Safari > Extensions).")
                    step(2, "Tap Maps Redirect and switch on Allow Extension.")
                    step(3, "Set All Websites to Allow so it can redirect links on any page.")
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                    }
                }

                Section("Try it") {
                    Link("Open a Google Maps link in Safari", destination: sampleLink)
                }
            }
            .navigationTitle("Maps Redirect")
        }
    }

    private func step(_ number: Int, _ text: String) -> some View {
        Label {
            Text(text)
        } icon: {
            Image(systemName: "\(number).circle.fill").foregroundStyle(.tint)
        }
    }
}

#Preview {
    ContentView()
}
