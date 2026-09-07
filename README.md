# Eco Hero operations console

Monitoring and research console for the Eco Hero game. It reads the same
Firestore project the Unity client writes to, with no import step in between.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The root redirects to the dashboard, which turns you
back to the sign in screen unless a session is already active.

## Getting in

There is no self registration. An account has to exist in Firebase
Authentication and be granted clearance separately.

1. Firebase console, Authentication, Users, Add user. Set an email and password.
2. Copy the generated User UID.
3. In Firestore, create a collection named `admins` if it does not exist.
4. Add a document whose **document ID is that UID**, not a field inside it.
5. Give it these fields:

| Field | Type | Value |
| --- | --- | --- |
| `role` | string | `admin` |
| `name` | string | The person's name |
| `createdAt` | timestamp | Now |

Credentials alone are not enough. Signing in with an account that has no
`admins` document ends the session and reports that clearance is missing.

## What it reads

Collection names are case sensitive, and every name here is spelled the way the
Unity client writes it. Nothing reads a collection the game does not produce, so
an empty view means the data really is absent.

| View | Collection |
| --- | --- |
| Players | `users` |
| Runs and leaderboard | `scores` |
| Sessions and level analytics | `gameSessions` |
| Player drawer inventory | `inventory` |
| Research | `questionnaire_responses` |
| Clearance | `admins` |
| Community | `communityPosts`, `communityBans` |

## Security rules

`firestore.rules` holds the access control this console assumes. The project is
still in test mode, which means any client with the public config can read and
rewrite any document, including another player's score. Test mode also expires
on a fixed date, and the game stops saving when it does.

```bash
firebase deploy --only firestore:rules
```

The `RequireAdmin` guard in the app stops an operator opening a page they should
not see. It is not a security boundary on its own, because anyone can run their
own client. The rules are what actually protects the data.

## Two things the game does not record yet

**Ecological output.** `scores` stores a single number per run. A score of 300
is three bags of litter or two saplings, and the two cannot be separated after
the fact, so the console reports litter and reforestation as unavailable rather
than inventing a figure. Writing `trashCollected` and `treesPlanted` alongside
the score in `EcoGameManager.SubmitScore` makes both figures real, and the views
pick them up with no change here.

**Community posts.** The moderation screen is complete and writes to
`communityPosts` and `communityBans`, but nothing creates posts yet. The Unity
client has no posting screen. For a ban to actually stop somebody posting, the
client that writes posts has to check `communityBans` first, which the rules
also enforce.

## Notes on behaviour

- The players table pages through Firestore with cursors, 25 rows at a time.
  Searching switches to a prefix match on username, because Firestore has no
  substring search: "sam" finds "Sameer" and not "Wasam".
- "Playing now" counts sessions opened in the last 15 minutes with no end time.
  Without the time bound, a run abandoned by closing the app would stay active
  forever.
- Level analytics are measured from opened and closed sessions. Levels are Unity
  scenes and cannot be edited from here, so the console reports how they perform
  rather than offering fields the game would never read.
- Every view has a loading, empty and error state. Empty states name the exact
  collection that returned nothing, and error states show the raw Firestore code.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Firebase Web SDK 12,
GSAP for entrance timelines, Motion for layout transitions and drawers, Lenis for
scrolling, Lucide for icons.
