import { Jsonp } from "@angular/http";
import { Injectable } from "@angular/core";
import { AngularFireAuth } from "angularfire2/auth";

@Injectable()
export class SpotifyOauthProvider {
  private endpoint: string = `https://us-central1-ebb-music.cloudfunctions.net`;

  constructor(private jsonp: Jsonp, private afAuth: AngularFireAuth) {}

  auth() {
    const code: string = this.getUrlParameter("code");
    const state: string = this.getUrlParameter("state");
    const error: string = this.getUrlParameter("error");

    if (error) {
      console.error(error);
    } else if (!code) {
      // Start the auth flow.
      window.location.href = `${this.endpoint}/redirect`;
    } else {
      const apiUrl = `${
        this.endpoint
      }/token?code=${code}&state=${state}&callback=JSONP_CALLBACK`;

      this.jsonp.get(apiUrl).subscribe((response: any) => {
        const user = response._body;
        this.afAuth.auth.signInWithCustomToken(user.firebaseToken);
      });
    }
  }

  /**
   * Returns the value of the given URL query parameter.
   */
  private getUrlParameter(name: string): string {
    return (
      decodeURIComponent(
        (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
          location.search
        ) || [null, ""])[1].replace(/\+/g, "%20")
      ) || null
    );
  }
}
