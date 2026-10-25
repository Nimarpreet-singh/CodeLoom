# CodeLoom

A small-room, peer-to-peer coding classroom built for Vercel and MongoDB Atlas.

## What is implemented

- Account registration/sign-in using signed, http-only session cookies.
- Classrooms with non-sequential invite codes, host controls, chat, and personal practice editors.
- Isolated editors: the host lesson is read-only for learners, while every learner has an independent private editor. Hosts can review those private editors only when the classroom permission is enabled.
- Browser-native audio/video, screen sharing, and presence for small peer-to-peer rooms.
- JavaScript runs in a browser sandbox; the host can select JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, or Kotlin. Non-JavaScript languages use the optional Piston-compatible compiler endpoint.
- A daily protected Vercel Cron MongoDB `ping` that keeps the Atlas M0 cluster active.
- Atlas-backed fixed-window rate limits on registration, sign-in, and room-code join attempts.

## Free-tier boundaries

This project deliberately uses browser peer-to-peer connections instead of a paid SFU/media provider. Keep rooms to **six people or fewer**. Video may fail on restrictive school, office, or mobile networks because reliable TURN relaying needs a continuously hosted TURN service. Do not market this as a large-class video system without adding a TURN server and SFU.

`y-webrtc` uses its public signaling service by default so browsers can find one another. It carries encrypted collaboration messages using the classroom-code password, but it is a free community service without an uptime guarantee. For a production-owned service, set up and configure a self-hosted y-webrtc signaling server and TURN server.

The browser runner supports JavaScript without any service. Non-JavaScript compilation requires `PISTON_API_URL` and, when the provider requires it, `PISTON_AUTH_TOKEN`. Piston is open source; its public endpoint now requires authorization for education/non-commercial use, so obtain the free authorized endpoint/token or deploy your own Piston-compatible server. Never expose an unrestricted compiler without rate limits.

## Local development

1. Install **Node 20.9 LTS or newer** (Node 18.17 on this machine is below Next.js's supported minimum).
2. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI`, `AUTH_SECRET`, and `CRON_SECRET`.
3. In MongoDB Atlas, create a least-privilege database user for the `codeloom` database. Vercel has dynamic outbound addresses, so configure Atlas network access deliberately and use a strong database password.
4. Run `npm install`, then `npm run dev`.

## Vercel deployment

Add the three required environment variables in Vercel Project Settings, import the repository, and deploy. `vercel.json` schedules `/api/cron/atlas-keepalive` once per day. Vercel attaches `Authorization: Bearer $CRON_SECRET` to that request; do not remove `CRON_SECRET`.

For Atlas M0, MongoDB currently documents automatic pausing after 30 days of inactivity. The daily database `ping` prevents a fully inactive cluster while Vercel Cron is active.

## Before public launch

- Configure a custom domain and HTTPS.
- Add email verification, password reset, account deletion, and per-user/IP rate limits.
- Add automated integration tests for registration, room authorization, policy updates, and concurrent editor recovery.
- Test audio/video and screen sharing on two devices and three networks.
- Add a privacy policy, consent language for media, moderation/reporting, and backup/export procedure.
# CodeLoom
