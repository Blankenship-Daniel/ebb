import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

@Injectable()
export class SpotifyProvider {
  private endpoint: string = "https://api.spotify.com";

  constructor(private http: HttpClient) {}

  getPlaylists(accessToken: string): Observable<any> {
    const url: string = `${
      this.endpoint
    }/v1/me/playlists?access_token=${accessToken}`;
    return this.http.get(url);
  }
}
