## Project Talk
Project Talk connects strangers through random peer-to-peer audio chats, fostering genuine human connections in our disconnected world. By prioritizing distant matches, it encourages conversations between people from diverse backgrounds. Through voice-only interactions, social anxieties are reduced, allowing for natural and comfortable conversations to unfold, revealing shared humanity beneath surface differences.

<p align="center">
  <img src="images/screenshot-readme-1.png" />
</p>

#### Install and run:
In order to run the project I highly recommend using [ngrok](https://ngrok.com/) (or similar) to tunnel the localhost:port you are using to a publicly accessible URL using SSL, as it is prohibited by most browsers to establish a WebRTC connection between peers over HTTP.

1. Make a ngrok account, and get your credentials.
2. Install ngrok on you machine and provide the credentials.
3. Run it to start the tunnel. (Just follow the simple guide on the ngrok website.)
4. Clone the repository.
5. Run `npm install` in `/server` and `/client`.
6. Go to `server/src/index.ts` and change the `PORT` constant to your preferred one and the `ORIGIN` constant to the URL provided by ngrok.
7. Go to `client/src/components/AudioCall.tsx` and change the `BASE_URL` constant to the URL provided by ngrok.
8. `cd` to `client` and run `npm start build` there, to build the app.
9. `cd` to `server` and run `npm start` there, to build and run the server.
10. The app is now running, and accessible from the internet.

#### Additional information:
The cables.gl patch that was created for the orb/bubble can be found here: https://cables.gl/p/mYAbMC
