import { Jsonp, Response } from "@angular/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { concatMap, map } from "rxjs/operators";
import { AngularFireAuth } from "angularfire2/auth";

@Injectable()
export class SpotifyOauthProvider {
  private endpoint: string = `https://us-central1-ebb-music.cloudfunctions.net`;

  constructor(private afAuth: AngularFireAuth, private jsonp: Jsonp) {}

  auth(): Observable<any> {
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

      return this.jsonp
        .get(apiUrl)
        .pipe(
          map((res: any) => res._body),
          concatMap(user =>
            this.afAuth.auth.signInWithCustomToken(user.firebaseToken)
          )
        );
    }

    return Observable.of(null);
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
