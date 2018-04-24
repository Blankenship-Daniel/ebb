import { Component } from "@angular/core";
import { Platform, LoadingController } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { TabsPage } from "../pages/tabs/tabs";

import { SpotifyProvider } from "../providers/spotify/spotify";
import { SpotifyOauthProvider } from "../providers/oauth/spotify-oauth";
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFireDatabase } from "angularfire2/database";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  rootPage: any = TabsPage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public loadingCtrl: LoadingController,
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private spotify: SpotifyProvider,
    private spotifyOauth: SpotifyOauthProvider
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  ngOnInit() {
    const loading = this.loadingCtrl.create({
      content: "Please wait"
    });
    loading.present();
    this.afAuth.authState.subscribe(user => {
      if (!user) {
        this.spotifyOauth.auth();
      } else {
        const itemRef = this.db.object(`spotifyAccessToken/${user.uid}`);
        itemRef.snapshotChanges().subscribe(action => {
          const spotifyAccessToken = action.payload.val();
          this.spotify
            .getPlaylists(spotifyAccessToken)
            .subscribe(
              res => console.log(res),
              err => console.error(err),
              () => loading.dismiss()
            );
        });
      }
    });
  }
}
