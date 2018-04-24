import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { JsonpModule } from "@angular/http";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { AngularFireModule } from "angularfire2";
import { AngularFireAuth } from "angularfire2/auth";
import { AngularFireDatabase } from "angularfire2/database";
import { firebaseConfig } from "../environment/firebase.config";

import { AboutPage } from "../pages/about/about";
import { ContactPage } from "../pages/contact/contact";
import { HomePage } from "../pages/home/home";
import { TabsPage } from "../pages/tabs/tabs";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { SpotifyOauthProvider } from "../providers/oauth/spotify-oauth";
import { SpotifyProvider } from "../providers/spotify/spotify";

@NgModule({
  declarations: [MyApp, AboutPage, ContactPage, HomePage, TabsPage],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    JsonpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp, AboutPage, ContactPage, HomePage, TabsPage],
  providers: [
    AngularFireAuth,
    AngularFireDatabase,
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    SpotifyOauthProvider,
    SpotifyProvider
  ]
})
export class AppModule {}
