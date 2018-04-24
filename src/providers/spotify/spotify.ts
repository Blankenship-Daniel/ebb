import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class SpotifyProvider {
  constructor(private http: HttpClient) {
    console.log(this.http);
  }
}
