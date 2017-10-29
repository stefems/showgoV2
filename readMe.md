Installation Requirements
- node/npm
- mongo
- my env files that you shouldn't have

To Do:
- In the get_spotify_user() function we send a request to spotify/me and it can fail because of the token being expired. We might have a refresh token and should use that in that scenario for minimal work from the user.