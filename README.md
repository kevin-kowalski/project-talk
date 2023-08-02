
## Project Talk
Project Talk randomly pairs two strangers in a peer-to-peer audio chat.
#### Install and run:
In order to run the project I highly recommend using [ngrok](https://ngrok.com/) (or similar) to tunnel the localhost:port you are using to a publicly accessible URL using SSL, as it is prohibited by most browsers to establish a WebRTC connection between peers over HTTP.

1. Make a ngrok account, and get your credentials.
2. Install ngrok on you machine and provide the credentials.
3. Run it to start the tunnel. (Just follow the simple guide on the ngrok website.)
4. Fork and clone the repository.
5. Run `npm install` in `/server` and `/client`.
6. Go to `server/src/index.ts` and change the `PORT` constant to your preferred one and the `ORIGIN` constant to the URL provided by ngrok.
7. Go to `client/src/components/AudioCall.tsx` and change the `BASE_URL` constant to the URL provided by ngrok.
8. `cd` to `client` and run `npm start build` there, to build the app.
9. `cd` to `server` and run `npm start` there, to build and run the server.
10. The app is now running, and accessible from the internet.

#### Known issues:
1. Running the project locally might need some fixes, as it gives CORS errors at the moment.
2. Ending a call and initiating one afterwards is not reliable at the moment, there might be something wrong with the "leave call" functionality.

#### Additional information:
The cables.gl patch used for the orb/bubble/blob can be found here: https://cables.gl/p/mYAbMC

#### Things to improve:
At the moment there are only two components in the React app, especially the AudioCall component is extremely bloated and would benefit from refactoring and modularization.
