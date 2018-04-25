import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { map } from "rxjs/operators";
import { Response } from "@angular/http";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class SpotifyProvider {
  private endpoint: string = "https://api.spotify.com/v1";

  constructor(private http: HttpClient) {}

  getPlaylists(accessToken: string): Observable<any> {
    const url: string = `${
      this.endpoint
    }/me/playlists?access_token=${accessToken}`;
    return this.http.get(url).pipe(map((res: Response) => res.json()));
  }
}
