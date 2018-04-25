"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const admin = require("firebase-admin");
const SpotifyWebApi = require("spotify-web-api-node");
// Firebase Setup
const serviceAccount = require("../service-account.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
});
// Spotify OAuth 2 setup
// TODO: Configure the `spotify.client_id` and `spotify.client_secret` Google Cloud environment variables.
const Spotify = new SpotifyWebApi({
    clientId: functions.config().spotify.client_id,
    clientSecret: functions.config().spotify.client_secret,
    redirectUri: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`
});
// Scopes to request.
const OAUTH_SCOPES = [
    "user-read-email",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
    "playlist-read-private",
    "user-read-playback-state",
    "user-read-currently-playing",
    "user-modify-playback-state",
    "user-read-recently-played",
    "user-top-read",
    "user-library-read",
    "user-library-modify",
    "streaming"
];
/**
 * Redirects the User to the Spotify authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.https.onRequest((req, res) => {
    cookieParser()(req, res, () => {
        const state = req.cookies.state || crypto.randomBytes(20).toString("hex");
        console.log("Setting verification state:", state);
        res.cookie("state", state.toString(), {
            maxAge: 3600000,
            secure: true,
            httpOnly: true
        });
        const authorizeURL = Spotify.createAuthorizeURL(OAUTH_SCOPES, state.toString());
        res.redirect(authorizeURL);
    });
});
/**
 * Exchanges a given Spotify auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token is sent back in a JSONP callback function with function name defined by the
 * 'callback' query parameter.
 */
exports.token = functions.https.onRequest((req, res) => {
    try {
        cookieParser()(req, res, () => {
            console.log("Received verification state:", req.cookies.state);
            console.log("Received state:", req.query.state);
            if (!req.cookies.state) {
                console.log("!req.cookies.state");
                throw new Error("State cookie not set or expired. Maybe you took too long to authorize. Please try again.");
            }
            else if (req.cookies.state !== req.query.state) {
                console.log("req.cookies.state !== req.query.state");
                throw new Error("State validation failed");
            }
            console.log("Received auth code:", req.query.code);
            Spotify.authorizationCodeGrant(req.query.code, (error, data) => {
                if (error) {
                    throw error;
                }
                console.log("Received Refresh Token:", data.body["access_token"]);
                console.log("Received Access Token:", data.body["access_token"]);
                Spotify.setAccessToken(data.body["access_token"]);
                Spotify.getMe((err, userResults) => {
                    if (err) {
                        throw err;
                    }
                    console.log("Auth code exchange result received:", userResults);
                    // We have a Spotify access token and the user identity now.
                    const spotifyAccessToken = data.body["access_token"];
                    const spotifyRefreshToken = data.body["refresh_token"];
                    const spotifyUserID = userResults.body["id"];
                    const profilePic = userResults.body["images"][0]["url"];
                    const userName = userResults.body["display_name"];
                    const email = userResults.body["email"];
                    // Create a Firebase account and get the Custom Auth Token.
                    return createFirebaseAccount(spotifyUserID, userName, profilePic, email, spotifyAccessToken, spotifyRefreshToken).then(firebaseToken => {
                        return res.jsonp({
                            userName: userName,
                            profilePic: profilePic,
                            email: email,
                            spotifyUserId: spotifyUserID,
                            spotifyAccessToken: spotifyAccessToken,
                            spotifyRefreshToken: spotifyRefreshToken,
                            firebaseToken: firebaseToken
                        });
                    });
                });
            });
        });
    }
    catch (error) {
        return res.jsonp({ error: error.toString });
    }
    return null;
});
/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /spotifyAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
function createFirebaseAccount(spotifyID, displayName, photoURL, email, accessToken, refreshToken) {
    // The UID we'll assign to the user.
    const uid = `spotify:${spotifyID}`;
    // Save the access token to the Firebase Realtime Database.
    const accessTokenTask = admin
        .database()
        .ref(`/spotifyAccessToken/${uid}`)
        .set(accessToken);
    // Save the refresh token to the Firebase Realtime Database.
    const refreshTokenTask = admin
        .database()
        .ref(`/spotifyRefreshToken/${uid}`)
        .set(refreshToken);
    // Create or update the user account.
    const userCreationTask = admin
        .auth()
        .updateUser(uid, {
        displayName: displayName,
        photoURL: photoURL,
        email: email,
        emailVerified: true
    })
        .catch(error => {
        // If user does not exists we create it.
        if (error.code === "auth/user-not-found") {
            return admin.auth().createUser({
                uid: uid,
                displayName: displayName,
                photoURL: photoURL,
                email: email,
                emailVerified: true
            });
        }
        throw error;
    });
    // Wait for all async tasks to complete, then generate and return a custom auth token.
    return Promise.all([userCreationTask, accessTokenTask, refreshTokenTask])
        .then(() => {
        // Create a Firebase custom auth token.
        return admin.auth().createCustomToken(uid);
    })
        .then(tok => {
        console.log('Created Custom token for UID "', uid, '" Token:', tok);
        return tok;
    });
}
//# sourceMappingURL=index.js.map