import UIKit
import React


@main
class AppDelegate: UIResponder, UIApplicationDelegate {
var window: UIWindow?
var bridge: RCTBridge!


func application(_ application: UIApplication,
didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {


bridge = RCTBridge(delegate: self, launchOptions: launchOptions)


let rootView = RCTRootView(bridge: bridge, moduleName: "TestProject", initialProperties: nil)
let rootViewController = UIViewController()
rootViewController.view = rootView


window = UIWindow(frame: UIScreen.main.bounds)
window?.rootViewController = rootViewController
window?.makeKeyAndVisible()


return true
}
}


extension AppDelegate: RCTBridgeDelegate {
func sourceURL(for bridge: RCTBridge!) -> URL! {
#if DEBUG
return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
}
}
