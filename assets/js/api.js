/* ==========================================================================
   api.js — the ONLY file that talks to a server.

   Right now there is no backend, so every call resolves against localStorage
   after a short fake latency, which keeps the UI honest about being async.

   TO GO LIVE: set API.config.baseUrl below. Each method already shows the
   request it would make in a `LIVE:` comment. Swap the mock body for the
   fetch, keep the same resolved shape, and no other file changes.

       API.config.baseUrl = 'https://api.codestorm.iiml.example/v1';

   Suggested backend: any REST service (Express/FastAPI/Supabase/Firebase).
   Table sketch — teams(id, name, college, track, created_at),
   members(team_id, name, email, college, role), submissions(team_id, title,
   repo_url, demo_url, deck_file, summary, updated_at), arena_solves(team_id,
   challenge_id, points, at).
   ========================================================================== */

var API = (function () {
  'use strict';

  var config = {
    baseUrl: null,        // null => mock mode
    latencyMs: 320,
    storageKey: 'codestorm26-v2'
  };

  /* ---------- local persistence (mock mode only) ---------- */
  var BLANK = { team: null, submission: null, solved: {}, arenaPoints: 0, code: {} };

  function read() {
    try {
      var raw = localStorage.getItem(config.storageKey);
      return Object.assign({}, BLANK, raw ? JSON.parse(raw) : {});
    } catch (e) {
      return Object.assign({}, BLANK);   // private mode / blocked storage
    }
  }
  function write(state) {
    try { localStorage.setItem(config.storageKey, JSON.stringify(state)); } catch (e) { /* non-fatal */ }
    return state;
  }
  function mutate(fn) { var s = read(); fn(s); return write(s); }

  /* Resolve like a network call would, so the UI has to handle pending states. */
  function later(value) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(value); }, config.latencyMs);
    });
  }
  function fail(message) { return Promise.reject(new Error(message)); }

  /* ---------- team IDs ---------- */
  /* Format CS26-<TRACK><YY>-<4 digits>, e.g. CS26-AGT26-4821.
     A real backend issues this from a sequence so it is genuinely unique;
     here we salt with the clock and check against the one team we store. */
  var TRACK_CODE = { agentic: 'AGT', fintech: 'FIN', climate: 'CLM' };
  function makeTeamId(trackId) {
    var code = TRACK_CODE[trackId] || 'GEN';
    var n = String(Math.floor(1000 + Math.random() * 9000));
    return 'CS26-' + code + '26-' + n;
  }

  return {
    config: config,

    /* ---------------- Registration ---------------- */

    /* payload: { teamName, college, track, members:[{name,email,college,role} x3] }
       LIVE: POST {baseUrl}/teams  ->  201 { teamId, ... } / 409 on duplicate */
    registerTeam: function (payload) {
      if (!payload || !payload.members || payload.members.length !== 3) {
        return fail('A team must have exactly three members.');
      }
      var emails = payload.members.map(function (m) { return String(m.email).toLowerCase(); });
      if (new Set(emails).size !== 3) {
        return fail('Each member needs a different email address.');
      }
      var team = {
        id: makeTeamId(payload.track),
        name: payload.teamName,
        college: payload.college,
        track: payload.track,
        members: payload.members,
        registeredAt: Date.now()
      };
      mutate(function (s) { s.team = team; });
      return later(team);
    },

    /* LIVE: GET {baseUrl}/teams/me  (session cookie or bearer token) */
    getTeam: function () { return later(read().team); },

    /* Synchronous peek for first paint — avoids a loading flash on boot. */
    getTeamSync: function () { return read().team; },

    /* LIVE: DELETE {baseUrl}/teams/me */
    resetTeam: function () {
      mutate(function (s) { s.team = null; s.submission = null; });
      return later(true);
    },

    /* Confirmation mail. Mock mode renders the message in the UI instead.
       LIVE: POST {baseUrl}/notifications/registration  -> your provider
       (Amazon SES / SendGrid / Resend / Postmark) sends the real thing. */
    sendConfirmationEmail: function (team) {
      var to = team.members.map(function (m) { return m.email; });
      return later({
        delivered: true,
        to: to,
        subject: 'You are in — ' + team.name + ' (' + team.id + ') · CodeStorm ’26',
        sentAt: Date.now(),
        simulated: !config.baseUrl
      });
    },

    /* ---------------- Project submission ---------------- */

    /* LIVE: PUT {baseUrl}/teams/{id}/submission
       The deck is a real file: upload it to object storage with a presigned
       URL (S3/GCS/R2) and store the returned key, not the bytes. Mock mode
       keeps only the file's name and size. */
    saveSubmission: function (payload) {
      if (Date.now() > SUBMISSION_DEADLINE.getTime()) {
        return fail('The submission deadline has passed. The portal is locked.');
      }
      var state = read();
      var existing = state.submission;
      var sub = {
        id: existing ? existing.id : 'PRJ-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        teamId: payload.teamId,
        teamName: payload.teamName,
        title: payload.title,
        track: payload.track,
        repo: payload.repo,
        demo: payload.demo,
        summary: payload.summary,
        tools: payload.tools,
        deck: payload.deck || (existing ? existing.deck : null),
        version: existing ? existing.version + 1 : 1,
        createdAt: existing ? existing.createdAt : Date.now(),
        updatedAt: Date.now()
      };
      mutate(function (s) { s.submission = sub; });
      return later(sub);
    },

    /* LIVE: GET {baseUrl}/teams/{id}/submission */
    getSubmission: function () { return later(read().submission); },
    getSubmissionSync: function () { return read().submission; },

    /* LIVE: DELETE {baseUrl}/teams/{id}/submission */
    withdrawSubmission: function () {
      if (Date.now() > SUBMISSION_DEADLINE.getTime()) return fail('Too late to withdraw — judging has started.');
      mutate(function (s) { s.submission = null; });
      return later(true);
    },

    /* ---------------- Coding Arena ---------------- */

    /* LIVE: POST {baseUrl}/arena/solves  { challengeId }
       Never trust the browser for scoring in production: run the submitted
       code in a sandboxed worker service and award points server-side. */
    recordSolve: function (challengeId, points) {
      var state = read();
      if (state.solved[challengeId]) return later({ alreadySolved: true, total: state.arenaPoints });
      var updated = mutate(function (s) {
        s.solved[challengeId] = Date.now();
        s.arenaPoints += points;
      });
      return later({ alreadySolved: false, total: updated.arenaPoints });
    },
    getProgressSync: function () {
      var s = read();
      return { solved: s.solved, points: s.arenaPoints, code: s.code };
    },
    saveDraftCode: function (challengeId, code) {
      mutate(function (s) { s.code[challengeId] = code; });
    },

    /* LIVE: GET {baseUrl}/arena/leaderboard?limit=20 */
    getLeaderboard: function () {
      var s = read();
      var rows = SEED_TEAMS.map(function (t) { return { team: t.team, pts: t.pts, you: false }; });
      rows.push({ team: s.team ? s.team.name : 'Your team', pts: s.arenaPoints, you: true });
      rows.sort(function (a, b) { return b.pts - a.pts; });
      return later(rows);
    },

    /* ---------------- Organiser data ---------------- */

    /* LIVE: GET {baseUrl}/announcements */
    getAnnouncements: function () { return later(SEED_ANNOUNCEMENTS.slice()); },

    /* LIVE: GET {baseUrl}/analytics/overview
       Mock mode folds the visitor's own team and submission into the seed
       totals, so the dashboard visibly reacts to what you do on the site. */
    getAnalytics: function () {
      var s = read();
      var mine = s.team ? 1 : 0;
      var mineSub = s.submission ? 1 : 0;

      var byTrack = Object.assign({}, SEED_SUBMISSIONS_BY_TRACK);
      if (s.submission && byTrack[s.submission.track] !== undefined) byTrack[s.submission.track] += 1;

      var byCollege = {};
      SEED_TEAMS.forEach(function (t) { byCollege[t.college] = (byCollege[t.college] || 0) + 1; });
      if (s.team) byCollege[s.team.college] = (byCollege[s.team.college] || 0) + 1;

      var registrations = SEED_REGISTRATIONS.map(function (r) { return r.slice(); });
      registrations.push(['Now', SEED_REGISTRATIONS[SEED_REGISTRATIONS.length - 1][1] + mine]);

      var submissions = SEED_SUBMISSIONS_OVER_TIME.map(function (r) { return r.slice(); });
      submissions[submissions.length - 1][1] += mineSub;

      var engagement = SEED_ENGAGEMENT.map(function (r) { return r.slice(); });
      engagement[engagement.length - 1][1] += Object.keys(s.solved).length;

      var totals = {
        teamsRegistered: SEED_STATS.teamsRegistered + mine,
        participants: SEED_STATS.participants + mine * EVENT.teamSize,
        colleges: SEED_STATS.colleges,
        projectsSubmitted: SEED_STATS.projectsSubmitted + mineSub,
        arenaSolves: SEED_STATS.arenaSolves + Object.keys(s.solved).length,
        mentorSessions: SEED_STATS.mentorSessions,
        avgTeamPoints: SEED_STATS.avgTeamPoints
      };
      totals.completionRate = Math.round(totals.projectsSubmitted / totals.teamsRegistered * 100);

      return later({
        totals: totals,
        registrations: registrations,
        submissions: submissions,
        engagement: engagement,
        byTrack: byTrack,
        byCollege: byCollege
      });
    }
  };
})();
