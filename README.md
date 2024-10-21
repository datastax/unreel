# re:invent Demo App UI

> ⚠️ This is a proof-of-concept and a research project under rapid and heavy development. It is nowhere near finished and was just started. To get up to speed, please read the [design doc](https://www.tldraw.com/ro/bJJ_oD7wKaF0GoDq5Lryv?d=v322.64.1732.1073.page).

This application explores what the above described application's UI might look like. It is a faux-monorepo with 2 directories: `ui` and `controller`.

- `ui` is an Astro app that is styled with Tailwind CSS and connects to a PartyKit server for real-time competition.
- `controller` is a PartyKit server that manages the game state and communicates with the UI.

These components are connected but are intended to be deployed separately: the PartyKit server via `npx partykit deploy` to PartyKit Cloud (an abstraction on Cloudflare), and the Astro app can be deployed to Vercel just like any other Astro app.

## Running Locally

To run this locally,

1. Clone the repo.
2. `cd` into each directory (`controller` and `ui`) and run `pnpm install` to install the dependencies.
3. Run `npx partykit dev` in the `controller` directory to start the PartyKit server.
4. Run `pnpm dev` in the `ui` directory to start the Astro app.

Both components should now be running locally and support live reloads.

## Current Status

- Each component (`controller` and `ui`) are connected and working, sending messages back and forth.
- We have an intro screen where a player chooses a team.
- We receive a `start` message from the server, and the game starts.
  - This message is sent to all connected clients via the `admin` page, where a DataStax employee can click a button to start the game.

### To Do

If this proves the concept and can work, the next steps are:

- [ ] Get movie quotes in response to the start event from the admin panel.
- [ ] Send quotes to all connected clients.
- [ ] Display distinct quotes on each client in a team/room's device.
- [ ] Recognize when only 1 client in a room has their phone facing upward within a time period.
- [ ] Submit the answer when only 1 client in a room has their phone facing upward, or when the time runs out.
- [ ] Update the score per room that finishes (`isCorrect * (timeRemaining + 1)`).
- [ ] Display the scores for each room on a separate display (maybe a separate project, maybe another Astro app in this "monorepo").
- [ ] Go to the next round (we have a total of 10 rounds).
- [ ] After the last round, add a "Game Over" screen that shows the winner.
- [ ] Invite the teams to go network at the happy hour (via UI).

## Concerns

- So far, the combination of PartyKit and Astro feels like a good fit. The code is clean and the separation of concerns is clear, it works very well. Despite this, should we consider relying on Amazon technologies instead since this is for AWS?
  - Perhaps we can just run this whole thing on EC2 since the load is light anyway.
