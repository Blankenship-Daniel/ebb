import { Component } from "@angular/core";
import { Platform, LoadingController } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { TabsPage } from "../pages/tabs/tabs";

import { SpotifyOauthProvider } from "../providers/oauth/spotify-oauth";
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFireDatabase } from "angularfire2/database";

import { Observable } from "rxjs/Rx";
import { merge, map } from "rxjs/operators";

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
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
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
        this.spotifyOauth.auth().subscribe(user => console.log(user));
      } else {
        this.getAccessTokens(user.uid).subscribe(tokens => {
          loading.dismiss();
        });
      }
    });
  }

  getAccessTokens(uid: string): Observable<any> {
    return Observable.combineLatest(
      this.db
        .object(`spotifyAccessToken/${uid}`)
        .snapshotChanges()
        .pipe(map(action => action.payload.val())),
      this.db
        .object(`spotifyRefreshToken/${uid}`)
        .snapshotChanges()
        .pipe(map(action => action.payload.val()))
    ).pipe(
      map(([accessToken, refreshToken]) => {
        return {
          accessToken,
          refreshToken
        };
      })
    );
  }
}
