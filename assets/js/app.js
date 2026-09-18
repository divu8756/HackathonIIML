/* ==========================================================================
   app.js — view routing, rendering and interaction.

   Content (dates, prizes, tracks, schedule, sponsors, FAQ) lives in data.js.
   All reads/writes of "backend" state go through api.js. This file only
   renders and wires up events — it should not need editing for a new
   edition of the event.
   ========================================================================== */
(function () {
  'use strict';

  var VIEWS = ['home', 'rules', 'register', 'arena', 'submit', 'dashboard', 'analytics'];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isUrl(v) { return /^https?:\/\/.+\..+/.test(v); }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function trackName(id) { var t = TRACKS.filter(function (x) { return x.id === id; })[0]; return t ? t.name : id; }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  /* Indian digit grouping: 1000000 -> "10,00,000" */
  function inr(n, withSymbol) {
    n = Math.round(n);
    var s = String(Math.abs(n));
    var last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest !== '') last3 = ',' + last3;
    var grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3;
    return (n < 0 ? '-' : '') + (withSymbol === false ? '' : '₹') + grouped;
  }

  /* ---------------- Toasts ---------------- */
  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  /* ============================================================
     Routing
     ============================================================ */
  function currentView() {
    var h = location.hash.replace(/^#\/?/, '');
    return VIEWS.indexOf(h) >= 0 ? h : 'home';
  }
  function showView(name, opts) {
    opts = opts || {};
    if (VIEWS.indexOf(name) < 0) name = 'home';
    VIEWS.forEach(function (v) {
      var el = $('view-' + v);
      if (el) el.classList.toggle('active', v === name);
    });
    document.querySelectorAll('#tabs .tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.dataset.view === name ? 'true' : 'false');
    });
    $('tabs').setAttribute('data-open', 'false');
    $('navToggle').setAttribute('aria-expanded', 'false');
    if (!opts.silent) history.pushState(null, '', '#/' + name);
    if (!opts.noScroll) window.scrollTo(0, 0);

    if (name === 'analytics') renderAnalytics();
    if (name === 'dashboard') renderDashboard();
    if (name === 'submit') renderSubmitView();
    if (name === 'arena') renderLeaderboard();
  }
  window.addEventListener('popstate', function () { showView(currentView(), { silent: true }); });
  $('tabs').addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (t) showView(t.dataset.view);
  });
  document.body.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goto]');
    if (!g) return;
    e.preventDefault();
    showView(g.dataset.goto);
  });
  $('navToggle').addEventListener('click', function () {
    var open = $('tabs').getAttribute('data-open') === 'true';
    $('tabs').setAttribute('data-open', String(!open));
    this.setAttribute('aria-expanded', String(!open));
  });

  /* ============================================================
     Theme
     ============================================================ */
  (function initTheme() {
    var root = document.documentElement, btn = $('themeBtn');
    function apply(mode) {
      root.setAttribute('data-theme', mode);
      btn.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' theme');
      btn.textContent = mode === 'dark' ? '◑' : '◐';
      if ($('view-analytics').classList.contains('active')) renderAnalytics();
    }
    var saved = null;
    try { saved = localStorage.getItem('codestorm26-theme'); } catch (e) {}
    apply(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'));
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem('codestorm26-theme', next); } catch (e) {}
    });
  })();

  /* ============================================================
     Live countdown — drives the ribbon, the hero block and the
     submission lock, all from the same tick.
     ============================================================ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

  var lastPhaseKey = null;
  function tickCountdown() {
    var now = Date.now(), next = null;
    for (var i = 0; i < MILESTONES.length; i++) { if (MILESTONES[i].at.getTime() > now) { next = MILESTONES[i]; break; } }

    var d, h, m, s, label, targetLabel, statusLabel, srText;
    if (!next) {
      d = h = m = s = '00';
      label = 'Event concluded — thank you for building with us';
      targetLabel = '';
      statusLabel = 'Event concluded';
      srText = 'The event has concluded.';
    } else {
      var diff = next.at.getTime() - now, sec = Math.floor(diff / 1000);
      d = Math.floor(sec / 86400); h = pad(Math.floor((sec % 86400) / 3600));
      m = pad(Math.floor((sec % 3600) / 60)); s = pad(sec % 60);
      label = next.label + ' in';
      targetLabel = fmtDate(next.at) + ' IST';
      statusLabel = next.key === 'reg' ? 'Registrations open' : next.key === 'start' ? 'Kickoff soon' : 'Hackathon is live';
      srText = d + ' days ' + h + ' hours ' + m + ' minutes to ' + next.label + '.';
    }

    $('ribbon-phase').textContent = next ? next.label : 'Event concluded';
    $('ribbon-clock').textContent = d + 'd ' + h + ':' + m + ':' + s;

    $('cd-phase').innerHTML = '<span class="live"><span class="live-dot"></span>LIVE</span> ' + esc(label);
    $('cd-target').textContent = targetLabel;
    $('cd-d').textContent = d; $('cd-h').textContent = h; $('cd-m').textContent = m; $('cd-s').textContent = s;
    $('hero-status').textContent = statusLabel;
    if (next && next.key !== lastPhaseKey) { $('cd-sr').textContent = srText; lastPhaseKey = next.key; }

    if (next) {
      var total = next.at.getTime() - TIMELINE_START, done = now - TIMELINE_START;
      $('cd-progress').style.width = Math.max(0, Math.min(100, (done / total) * 100)) + '%';
    } else {
      $('cd-progress').style.width = '100%';
    }

    var ms = $('cd-milestones');
    if (ms.childElementCount === 0) {
      MILESTONES.forEach(function (mi) {
        var span = document.createElement('span');
        span.className = 'cd-ms'; span.dataset.key = mi.key; span.textContent = mi.short;
        ms.appendChild(span);
      });
    }
    ms.querySelectorAll('.cd-ms').forEach(function (sp) {
      var mi = milestone(sp.dataset.key);
      sp.classList.remove('done', 'cur');
      if (mi.at.getTime() <= now) sp.classList.add('done');
      else if (next && mi.key === next.key) sp.classList.add('cur');
    });

    // deadline lock is re-checked live so a team mid-edit sees it lock in real time
    updateSubmitLockState();
  }
  setInterval(tickCountdown, 1000);

  /* ============================================================
     Home content — rendered from data.js
     ============================================================ */
  function renderHome() {
    $('hero-tagline').textContent = EVENT.tagline + ' ' + EVENT.host + ', ' + EVENT.datesLabel + '.';
    $('hero-dates').textContent = EVENT.datesLabel;
    $('hero-venue').textContent = EVENT.venue;
    $('hero-prize').textContent = inr(EVENT.prizePool);

    $('home-kpis').innerHTML = [
      { v: SEED_STATS.teamsRegistered + '+', l: 'Teams registered', c: 'v-violet' },
      { v: SEED_STATS.colleges, l: 'Colleges represented', c: 'v-cyan' },
      { v: inr(EVENT.prizePool), l: 'Total prize pool', c: 'v-gold' },
      { v: EVENT.teamSize, l: 'Members per team', c: 'v-mint' }
    ].map(kpiHtml).join('');

    var pod = PRIZES.podium.map(function (p) {
      return '<div class="prize-card ' + p.cls + '"><div class="rank">' + p.medal + ' ' + esc(p.rank) + '</div>' +
        '<div class="val">' + inr(p.amount) + '</div><div class="sub">' + esc(p.note) + '</div></div>';
    }).join('');
    $('podium').innerHTML = pod;

    $('special-prizes').innerHTML = PRIZES.special.map(function (p) {
      return '<div class="special"><div class="n">' + esc(p.name) + '</div><div class="a">' + inr(p.amount) + '</div></div>';
    }).join('');

    var podiumTotal = PRIZES.podium.reduce(function (a, p) { return a + p.amount; }, 0);
    var specialTotal = PRIZES.special.reduce(function (a, p) { return a + p.amount; }, 0);
    $('prize-total').innerHTML = PRIZES.podium.map(function (p) { return inr(p.amount); }).join(' + ') +
      ' + ' + inr(specialTotal) + ' (special prizes) = <b>' + inr(podiumTotal + specialTotal) + '</b>';

    $('track-grid').innerHTML = TRACKS.map(function (t) {
      return '<div class="card track-card"><div class="ico" aria-hidden="true">' + t.icon + '</div>' +
        '<h3>' + esc(t.name) + '</h3><p>' + esc(t.blurb) + '</p>' +
        '<div class="chips">' + t.tags.map(function (tag) { return '<span class="chip">' + esc(tag) + '</span>'; }).join('') + '</div></div>';
    }).join('');

    renderSchedule(0);

    var tiersHtml = '';
    tiersHtml += sponsorTier('Title sponsor', SPONSORS.title, 'title-tier');
    tiersHtml += sponsorTier('Gold sponsors', SPONSORS.gold, '');
    tiersHtml += sponsorTier('Community partners', SPONSORS.partners, '', 'small');
    $('sponsor-tiers').innerHTML = tiersHtml;

    $('faq-list').innerHTML = FAQ.map(function (f, i) {
      return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><div class="answer"><p>' + esc(f.a) + '</p></div></details>';
    }).join('');

    ['sponsor-mail', 'faq-mail', 'conduct-mail', 'foot-mail'].forEach(function (id) {
      var el = $(id);
      if (el) el.href = 'mailto:' + EVENT.contact + (id === 'sponsor-mail' ? '?subject=Sponsorship%20deck%20request' : '');
      if (el && id === 'faq-mail') el.textContent = EVENT.contact;
    });
  }

  function kpiHtml(i) { return '<div class="kpi ' + i.c + '"><div class="v">' + i.v + '</div><div class="l">' + i.l + '</div></div>'; }

  function sponsorTier(title, list, extraClass, gridClass) {
    var cards = list.map(function (s) {
      return '<div class="sponsor ' + (extraClass || '') + '"><span class="logo" style="background:' + s.color + '">' + esc(s.logo) + '</span><span class="nm">' + esc(s.name) + '</span></div>';
    }).join('');
    return '<div class="sponsor-tier"><h3>' + esc(title) + '</h3><div class="sponsor-grid ' + (gridClass || '') + '">' + cards + '</div></div>';
  }

  function renderSchedule(activeDay) {
    $('day-tabs').innerHTML = SCHEDULE.map(function (day, i) {
      return '<button class="tab" role="tab" data-day="' + i + '" aria-selected="' + (i === activeDay) + '">' + esc(day.day) + '</button>';
    }).join('');
    var day = SCHEDULE[activeDay];
    $('timeline').innerHTML = '<li class="note" style="list-style:none;margin-bottom:14px;padding-left:0"><b style="color:var(--text)">' + esc(day.subtitle) + '</b></li>' +
      day.items.map(function (it) {
        return '<li class="' + (it.key ? 'key' : '') + '"><div class="t mono">' + esc(it.t) + ' IST</div><div class="e">' + esc(it.e) + '</div><div class="d">' + esc(it.d) + '</div></li>';
      }).join('');
  }
  $('day-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-day]');
    if (b) renderSchedule(Number(b.dataset.day));
  });

  /* ============================================================
     Rules page — rubric & timeline tables
     ============================================================ */
  function renderRules() {
    $('rubric-body').innerHTML = RUBRIC.map(function (r) {
      return '<tr><td>' + esc(r.c) + '<div class="weight-bar"><i style="width:' + r.w + '%"></i></div></td>' +
        '<td class="num">' + r.w + '%</td><td class="note">' + esc(r.d) + '</td></tr>';
    }).join('');
    $('timeline-body').innerHTML = MILESTONES.map(function (m) {
      var note = m.key === 'reg' ? 'Registration form closes to new teams.' :
        m.key === 'start' ? 'Problem statements unlock in the Coding Arena.' :
        m.key === 'submit' ? 'Submission portal locks automatically.' : 'Results announced, prize money confirmed.';
      return '<tr><td><b>' + esc(m.label) + '</b></td><td class="mono">' + fmtDate(m.at) + '</td><td class="note">' + note + '</td></tr>';
    }).join('');
  }

  /* ============================================================
     Registration
     ============================================================ */
  function populateTrackSelects() {
    var opts = TRACKS.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');
    $('r-track').insertAdjacentHTML('beforeend', opts);
    $('s-track').insertAdjacentHTML('beforeend', opts);
  }

  function buildMemberFields() {
    var wrap = $('member-fields');
    var html = '';
    for (var i = 1; i <= EVENT.teamSize; i++) {
      var isLead = i === 1;
      html += '<fieldset>' +
        '<legend><span class="num" aria-hidden="true">' + i + '</span> Member ' + i + (isLead ? ' · Team Lead' : '') + '</legend>' +
        '<div class="two">' +
          '<div class="field"><label for="m' + i + '-name">Full name <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="m' + i + '-name" type="text" required autocomplete="name" placeholder="Full name" aria-describedby="m' + i + '-name-err">' +
            '<p class="err-msg" id="m' + i + '-name-err" role="alert"></p></div>' +
          '<div class="field"><label for="m' + i + '-email">Email <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="m' + i + '-email" type="email" required autocomplete="email" placeholder="name@college.edu" aria-describedby="m' + i + '-email-err">' +
            '<p class="err-msg" id="m' + i + '-email-err" role="alert"></p></div>' +
        '</div>' +
        '<div class="two">' +
          '<div class="field"><label for="m' + i + '-college">College <span class="req" aria-hidden="true">*</span></label>' +
            '<input id="m' + i + '-college" type="text" required list="college-list" placeholder="College name" aria-describedby="m' + i + '-college-err">' +
            '<p class="err-msg" id="m' + i + '-college-err" role="alert"></p></div>' +
          '<div class="field"><label for="m' + i + '-role">Role <span class="req" aria-hidden="true">*</span></label>' +
            '<select id="m' + i + '-role" required aria-describedby="m' + i + '-role-err"><option value="">Select…</option>' +
            ROLES.map(function (r) { return '<option' + (isLead && r === 'Team Lead' ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
            '</select><p class="err-msg" id="m' + i + '-role-err" role="alert"></p></div>' +
        '</div>' +
      '</fieldset>';
    }
    wrap.innerHTML = html;
    // pre-fill member 1's college from the team's primary college for convenience
    $('r-college').addEventListener('input', function () {
      var m1c = $('m1-college');
      if (m1c && !m1c.dataset.touched) m1c.value = this.value;
    });
    $('m1-college').addEventListener('input', function () { this.dataset.touched = '1'; });
  }

  function setErr(fieldId, errId, message) {
    var f = $(fieldId), e = $(errId);
    if (message) { if (f) f.setAttribute('aria-invalid', 'true'); if (e) e.textContent = message; }
    else { if (f) f.removeAttribute('aria-invalid'); if (e) e.textContent = ''; }
    return !message;
  }
  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }

  function validateRegistration() {
    var ok = true;
    ok = setErr('r-team', 'r-team-err', val('r-team') ? '' : 'Team name is required.') && ok;
    ok = setErr('r-college', 'r-college-err', val('r-college') ? '' : 'Primary college is required.') && ok;
    ok = setErr('r-track', 'r-track-err', val('r-track') ? '' : 'Choose a track.') && ok;

    var members = [], emails = [];
    for (var i = 1; i <= EVENT.teamSize; i++) {
      var name = val('m' + i + '-name'), email = val('m' + i + '-email'), college = val('m' + i + '-college'), role = val('m' + i + '-role');
      ok = setErr('m' + i + '-name', 'm' + i + '-name-err', name ? '' : 'Required.') && ok;
      ok = setErr('m' + i + '-email', 'm' + i + '-email-err', !email ? 'Required.' : (isEmail(email) ? '' : 'Enter a valid email.')) && ok;
      ok = setErr('m' + i + '-college', 'm' + i + '-college-err', college ? '' : 'Required.') && ok;
      ok = setErr('m' + i + '-role', 'm' + i + '-role-err', role ? '' : 'Required.') && ok;
      members.push({ name: name, email: email, college: college, role: role });
      if (email) emails.push(email.toLowerCase());
    }
    var uniqueEmails = new Set(emails).size === emails.length;
    if (!uniqueEmails && emails.length === EVENT.teamSize) {
      setErr('m2-email', 'm2-email-err', 'Each member needs a different email address.');
      ok = false;
    }
    var agree = $('r-agree').checked;
    setErr('r-agree', 'r-agree-err', agree ? '' : 'You must agree to the rules to register.');
    ok = agree && ok;

    return ok ? { teamName: val('r-team'), college: val('r-college'), track: val('r-track'), members: members } : null;
  }

  function renderRegistrationSuccess(team) {
    $('reg-form-wrap').hidden = true;
    var membersRows = team.members.map(function (m) {
      return '<div class="row"><span class="k">' + esc(m.role) + '</span><span class="v">' + esc(m.name) + '</span></div>';
    }).join('');
    var success = $('reg-success');
    success.hidden = false;
    success.innerHTML =
      '<div class="receipt">' +
        '<div class="receipt-head"><div class="note">✓ Registration confirmed</div><div class="team-id mono">' + esc(team.id) + '</div></div>' +
        '<div class="receipt-body">' +
          '<div class="kv" style="margin-bottom:20px">' +
            '<div class="row"><span class="k">Team</span><span class="v">' + esc(team.name) + '</span></div>' +
            '<div class="row"><span class="k">College</span><span class="v">' + esc(team.college) + '</span></div>' +
            '<div class="row"><span class="k">Track</span><span class="v">' + esc(trackName(team.track)) + '</span></div>' +
            membersRows +
          '</div>' +
          '<div class="email-preview" id="reg-email-preview"></div>' +
          '<div class="form-actions" style="margin-top:20px">' +
            '<button class="btn btn-primary" data-goto="dashboard">Go to Team Dashboard →</button>' +
            '<button class="btn btn-ghost" data-goto="arena">Warm up in the Coding Arena</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    API.sendConfirmationEmail(team).then(function (mail) {
      var box = $('reg-email-preview');
      if (!box) return;
      box.innerHTML =
        '<div class="email-head">' +
          '<div class="line"><span class="k">To</span><span>' + mail.to.map(esc).join(', ') + '</span></div>' +
          '<div class="line"><span class="k">Subject</span><span>' + esc(mail.subject) + '</span></div>' +
        '</div>' +
        '<div class="email-body">' +
          '<p>Hi ' + esc(team.members[0].name) + ',</p>' +
          '<p><strong>' + esc(team.name) + '</strong> is registered for CodeStorm ’26. Your team ID is <strong>' + esc(team.id) + '</strong> — you’ll need it at check-in and in the submission portal.</p>' +
          '<p>Track: ' + esc(trackName(team.track)) + '. Registrations close ' + fmtDate(REGISTRATION_CLOSE) + ' IST.</p>' +
          '<p class="note" style="margin-top:10px">' + (mail.simulated ? 'Simulated — no backend is connected, so this email was not actually sent.' : 'Delivered.') + '</p>' +
        '</div>';
      toast('Confirmation email simulated for ' + team.members.length + ' member(s).');
    });
  }

  $('regForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('regMsg'); msg.className = 'form-msg'; msg.textContent = '';
    var payload = validateRegistration();
    if (!payload) { msg.textContent = 'Please fix the highlighted fields.'; msg.classList.add('err'); return; }

    var btn = $('regSubmit'); btn.disabled = true; btn.textContent = 'Registering…';
    API.registerTeam(payload).then(function (team) {
      btn.disabled = false; btn.textContent = 'Register team →';
      msg.textContent = '✓ Team registered!'; msg.classList.add('ok');
      renderRegistrationSuccess(team);
      renderDashboard();
      renderHome();
    }, function (err) {
      btn.disabled = false; btn.textContent = 'Register team →';
      msg.textContent = err.message; msg.classList.add('err');
    });
  });

  /* ============================================================
     Coding Arena
     ============================================================ */
  var curChal = CHALLENGES[0];

  function fmtArg(a) { try { return JSON.stringify(a); } catch (e) { return String(a); } }

  function renderChalTabs() {
    var progress = API.getProgressSync();
    $('chalTabs').innerHTML = CHALLENGES.map(function (c) {
      return '<button class="chal-pick' + (progress.solved[c.id] ? ' solved' : '') + '" data-id="' + c.id + '" role="tab" aria-selected="' + (c.id === curChal.id) + '">' + esc(c.title) + '</button>';
    }).join('');
  }

  function loadChallenge(c) {
    curChal = c;
    var progress = API.getProgressSync();
    $('chalTitle').textContent = c.title;
    $('chalDesc').textContent = c.desc;
    var diff = $('chalDiff'); diff.textContent = c.diff.toUpperCase(); diff.className = 'tagchip ' + c.diff;
    $('chalPts').textContent = '+' + c.pts + ' pts';
    $('chalSolved').textContent = progress.solved[c.id] ? '✓ solved' : '';
    $('codeArea').value = progress.code[c.id] || c.starter;
    $('console').innerHTML = '<span class="dim">Test results will appear here.</span>';
    $('arenaPoints').textContent = 'Your points: ' + progress.points;
    renderChalTabs();
  }

  $('chalTabs').addEventListener('click', function (e) {
    var b = e.target.closest('.chal-pick');
    if (b) loadChallenge(CHALLENGES.filter(function (x) { return x.id === b.dataset.id; })[0]);
  });
  $('resetBtn').addEventListener('click', function () { $('codeArea').value = curChal.starter; });
  $('codeArea').addEventListener('input', function () { API.saveDraftCode(curChal.id, this.value); });
  $('runBtn').addEventListener('click', runTests);

  function runTests() {
    var con = $('console'); var code = $('codeArea').value;
    var fn;
    try {
      fn = (new Function(code + '\n; return typeof ' + curChal.fn + '==="function"?' + curChal.fn + ':null;'))();
      if (!fn) { con.innerHTML = '<span class="fail">✗ Could not find a function named ' + curChal.fn + '(). Keep that name.</span>'; return; }
    } catch (err) { con.innerHTML = '<span class="fail">✗ Syntax error: ' + esc(String(err.message || err)) + '</span>'; return; }

    var passed = 0, out = [];
    for (var i = 0; i < curChal.tests.length; i++) {
      var t = curChal.tests[i], args = t[0], exp = t[1], got;
      try { got = fn.apply(null, args); } catch (err) { out.push('<span class="fail">✗ case ' + (i + 1) + ' threw: ' + esc(String(err.message || err)) + '</span>'); continue; }
      var ok = JSON.stringify(got) === JSON.stringify(exp);
      if (ok) passed++;
      out.push('<span class="' + (ok ? 'pass' : 'fail') + '">' + (ok ? '✓' : '✗') + ' ' + curChal.fn + '(' + args.map(fmtArg).join(', ') + ') → ' + fmtArg(got) + (ok ? '' : ' <span class="dim">(expected ' + fmtArg(exp) + ')</span>') + '</span>');
    }
    var all = passed === curChal.tests.length;
    con.innerHTML = '<span class="' + (all ? 'pass' : 'dim') + '">' + passed + '/' + curChal.tests.length + ' tests passed' + (all ? ' — challenge cleared!' : '') + '</span>\n' + out.join('\n');

    if (all) {
      API.recordSolve(curChal.id, curChal.pts).then(function (res) {
        if (!res.alreadySolved) {
          $('chalSolved').textContent = '✓ solved';
          $('arenaPoints').textContent = 'Your points: ' + res.total;
          renderChalTabs(); renderLeaderboard(); renderHome();
        }
      });
    }
  }

  function renderLeaderboard() {
    API.getLeaderboard().then(function (rows) {
      var tb = document.querySelector('#leaderboard tbody');
      if (!tb) return;
      tb.innerHTML = rows.map(function (r, i) {
        var rb = i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : '';
        var medal = i < 3 ? '★' : (i + 1);
        return '<tr class="' + (r.you ? 'you' : '') + '"><td><span class="rankbadge ' + rb + '">' + medal + '</span></td><td>' + esc(r.team) + (r.you ? ' <span class="note">(you)</span>' : '') + '</td><td class="pts">' + r.pts + '</td></tr>';
      }).join('');
    });
    $('arenaPoints').textContent = 'Your points: ' + API.getProgressSync().points;
  }

  function renderArenaStatic() {
    $('res-list').innerHTML = RESOURCES.map(function (r) {
      return '<li><a href="' + esc(r.href) + '"><span class="ico" aria-hidden="true">' + r.ico + '</span><span><b>' + esc(r.label) + '</b><br><span class="note">' + esc(r.note) + '</span></span></a></li>';
    }).join('');
    $('ps-list').innerHTML = PROBLEM_STATEMENTS.map(function (p) {
      return '<div class="card ps-card"><div class="meta">' + esc(p.id) + ' · ' + esc(p.track) + (p.partner ? ' · with ' + esc(p.partner) : '') + '</div>' +
        '<h4>' + esc(p.title) + '</h4><p class="note" style="margin-top:6px">' + esc(p.body) + '</p></div>';
    }).join('');
  }

  /* ============================================================
     Project submission
     ============================================================ */
  function submissionLocked() { return Date.now() > SUBMISSION_DEADLINE.getTime(); }

  function updateSubmitLockState() {
    var form = $('subForm');
    if (!form) return;
    var locked = submissionLocked();
    Array.prototype.forEach.call(form.elements, function (el) { el.disabled = locked; });
    $('subSubmit').textContent = locked ? 'Submissions closed' : (API.getSubmissionSync() ? 'Update submission' : 'Submit project');
  }

  function renderSubmitView() {
    var team = API.getTeamSync();
    var sub = API.getSubmissionSync();
    var locked = submissionLocked();

    var banner = $('sub-deadline-banner');
    if (locked) {
      banner.innerHTML = '<div class="alert danger"><span class="ico" aria-hidden="true">🔒</span><p><b>Submissions closed</b> at ' + fmtDate(SUBMISSION_DEADLINE) + ' IST. The portal no longer accepts edits.</p></div>';
    } else {
      banner.innerHTML = '<div class="alert"><span class="ico" aria-hidden="true">⏳</span><p>Open until <b>' + fmtDate(SUBMISSION_DEADLINE) + ' IST</b>. Save as many times as you like — the last version before the deadline is judged.</p></div>';
    }

    if (!team) {
      $('sub-status').innerHTML = '<p class="note">No team on this device yet. <a href="#/register" data-goto="register">Register first</a> so your submission is linked to a team ID.</p>';
    } else if (sub) {
      $('sub-status').innerHTML =
        '<div class="alert ok"><span class="ico" aria-hidden="true">✓</span><p><b>Submitted</b> — version ' + sub.version + ', last saved ' + new Date(sub.updatedAt).toLocaleString('en-IN') + '.</p></div>';
      $('s-title').value = sub.title; $('s-track').value = sub.track; $('s-repo').value = sub.repo;
      $('s-demo').value = sub.demo; $('s-summary').value = sub.summary; $('s-tools').value = sub.tools;
      $('s-count').textContent = countWords(sub.summary);
      if (sub.deck) $('s-deck-name').textContent = 'Current file: ' + sub.deck.name + ' (' + sub.deck.size + ')';
      $('withdrawBtn').hidden = locked;
    } else {
      $('sub-status').innerHTML = '<div class="empty">No project submitted yet.</div>';
      $('withdrawBtn').hidden = true;
    }

    var checks = [
      { label: 'Team registered', done: !!team },
      { label: 'Repository link added', done: !!(sub && sub.repo) },
      { label: 'Demo video linked', done: !!(sub && sub.demo) },
      { label: 'Slide deck attached', done: !!(sub && sub.deck) },
      { label: 'Tools & AI use declared', done: !!(sub && sub.tools) }
    ];
    $('sub-checklist').innerHTML = checks.map(function (c) {
      return '<li class="' + (c.done ? 'done' : '') + '"><span class="bx">' + (c.done ? '✓' : '○') + '</span><span>' + c.label + '</span></li>';
    }).join('');

    updateSubmitLockState();
  }

  function countWords(s) { s = (s || '').trim(); return s ? s.split(/\s+/).length : 0; }
  $('s-summary').addEventListener('input', function () { $('s-count').textContent = countWords(this.value); });
  $('s-deck').addEventListener('change', function () {
    var f = this.files && this.files[0];
    $('s-deck-name').textContent = f ? 'Selected: ' + f.name + ' (' + (f.size / 1024 / 1024).toFixed(1) + ' MB)' : '';
  });

  function validateSubmission() {
    var ok = true;
    ok = setErr('s-title', 's-title-err', val('s-title') ? '' : 'Project title is required.') && ok;
    ok = setErr('s-track', 's-track-err', val('s-track') ? '' : 'Choose a track.') && ok;
    var repo = val('s-repo');
    ok = setErr('s-repo', 's-repo-err', !repo ? 'Required.' : (isUrl(repo) ? '' : 'Enter a valid URL starting with http.')) && ok;
    var demo = val('s-demo');
    ok = setErr('s-demo', 's-demo-err', !demo ? 'Required.' : (isUrl(demo) ? '' : 'Enter a valid URL starting with http.')) && ok;
    var summary = val('s-summary');
    var words = countWords(summary);
    ok = setErr('s-summary', 's-summary-err', !summary ? 'Required.' : (words > 150 ? 'Keep it to 150 words (currently ' + words + ').' : '')) && ok;
    ok = setErr('s-tools', 's-tools-err', val('s-tools') ? '' : 'Declare your tools, even if the answer is "none".') && ok;

    var existing = API.getSubmissionSync();
    var deckFile = $('s-deck').files && $('s-deck').files[0];
    ok = setErr('s-deck', 's-deck-err', (!deckFile && !(existing && existing.deck)) ? 'Attach your slide deck (PDF).' : '') && ok;

    if (!ok) return null;
    return {
      title: val('s-title'), track: val('s-track'), repo: repo, demo: demo, summary: summary, tools: val('s-tools'),
      deck: deckFile ? { name: deckFile.name, size: (deckFile.size / 1024 / 1024).toFixed(1) + ' MB' } : null
    };
  }

  $('subForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (submissionLocked()) return;
    var msg = $('subMsg'); msg.className = 'form-msg'; msg.textContent = '';
    var team = API.getTeamSync();
    if (!team) { msg.textContent = 'Register your team before submitting.'; msg.classList.add('err'); return; }
    var payload = validateSubmission();
    if (!payload) { msg.textContent = 'Please fix the highlighted fields.'; msg.classList.add('err'); return; }
    payload.teamId = team.id; payload.teamName = team.name;

    var btn = $('subSubmit'); btn.disabled = true; btn.textContent = 'Saving…';
    API.saveSubmission(payload).then(function (sub) {
      msg.textContent = '✓ Submission saved (v' + sub.version + ').'; msg.classList.add('ok');
      toast('Project submitted for ' + team.name + '.');
      renderSubmitView(); renderDashboard(); renderHome();
    }, function (err) {
      msg.textContent = err.message; msg.classList.add('err');
      btn.disabled = false;
      updateSubmitLockState();
    });
  });

  $('withdrawBtn').addEventListener('click', function () {
    if (!confirm('Withdraw your submission? You can resubmit any time before the deadline.')) return;
    API.withdrawSubmission().then(function () {
      $('subForm').reset(); $('s-count').textContent = '0'; $('s-deck-name').textContent = '';
      toast('Submission withdrawn.');
      renderSubmitView(); renderDashboard();
    }, function (err) { toast(err.message); });
  });

  /* ============================================================
     Team dashboard
     ============================================================ */
  var AV_COLORS = ['var(--violet)', 'var(--gold)', 'var(--mint)', 'var(--cyan)'];

  function renderDashboard() {
    var team = API.getTeamSync();
    $('dash-empty').hidden = !!team;
    $('dash-main').hidden = !team;
    if (!team) return;

    var sub = API.getSubmissionSync();
    var progress = API.getProgressSync();
    var solvedCount = Object.keys(progress.solved).length;

    $('d-track').textContent = trackName(team.track);
    $('d-name').textContent = team.name;
    $('d-id').textContent = team.id + ' · ' + team.college;
    $('d-points').textContent = progress.points;

    $('d-members').innerHTML = team.members.map(function (m, i) {
      var initials = (m.name || '?').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
      return '<div class="member-row"><span class="avatar" style="background:' + AV_COLORS[i % AV_COLORS.length] + '">' + esc(initials) + '</span>' +
        '<div class="who"><div class="nm">' + esc(m.name) + ' <span class="note">· ' + esc(m.role) + '</span></div><div class="meta">' + esc(m.email) + '</div></div></div>';
    }).join('');

    var statuses = [];
    statuses.push('<span class="status on">✓ Registered</span>');
    statuses.push(solvedCount > 0 ? '<span class="status on">✓ ' + solvedCount + ' arena challenge' + (solvedCount > 1 ? 's' : '') + ' solved</span>' : '<span class="status warn">○ No arena points yet</span>');
    statuses.push(sub ? '<span class="status on">✓ Project submitted</span>' : '<span class="status warn">○ Project not submitted</span>');
    statuses.push(submissionLocked() ? '<span class="status warn">🔒 Submissions closed</span>' : '<span class="status on">🕐 Submissions open</span>');
    $('d-statuses').innerHTML = statuses.join('');

    var checks = [
      { label: 'Team of three registered', done: true },
      { label: 'Track selected', done: !!team.track },
      { label: 'Practised in the Coding Arena', done: solvedCount > 0 },
      { label: 'Project repository submitted', done: !!sub },
      { label: 'Demo video linked', done: !!(sub && sub.demo) },
      { label: 'Slide deck attached', done: !!(sub && sub.deck) }
    ];
    var doneN = checks.filter(function (c) { return c.done; }).length;
    var pct = Math.round(doneN / checks.length * 100);
    $('d-readpct').textContent = pct;
    $('d-readbar').style.width = pct + '%';
    $('d-checklist').innerHTML = checks.map(function (c) {
      return '<li class="' + (c.done ? 'done' : '') + '"><span class="bx">' + (c.done ? '✓' : '○') + '</span><span>' + c.label + '</span></li>';
    }).join('');

    var sc = $('d-submission');
    if (sub) {
      sc.innerHTML = '<div class="track-tag">' + esc(trackName(sub.track)) + '</div>' +
        '<h4 style="font-size:1.05rem;margin:2px 0">' + esc(sub.title) + '</h4><p class="note">' + esc(sub.summary) + '</p>' +
        '<div class="sub-links"><a href="' + esc(sub.repo) + '" target="_blank" rel="noopener">↗ Repository</a>' +
        '<a href="' + esc(sub.demo) + '" target="_blank" rel="noopener">▶ Demo video</a></div>';
    } else {
      sc.innerHTML = '<div class="empty">No project submitted yet.<br><button class="btn btn-ghost btn-sm" data-goto="submit" style="margin-top:10px">Submit now →</button></div>';
    }

    API.getAnnouncements().then(function (list) {
      $('d-announce').innerHTML = list.map(function (a) {
        return '<li><span class="tag ' + a.tag + '">' + a.tag + '</span><span class="what">' + esc(a.text) + '</span><span class="when mono">' + esc(a.at) + '</span></li>';
      }).join('');
    });
  }

  $('resetTeamBtn').addEventListener('click', function () {
    if (!confirm('Reset your team? This clears the team and submission stored on this device.')) return;
    API.resetTeam().then(function () {
      $('regForm').reset(); $('reg-success').hidden = true; $('reg-form-wrap').hidden = false;
      toast('Team reset.');
      renderDashboard(); renderHome(); renderLeaderboard();
    });
  });

  /* ============================================================
     Analytics (organiser-facing)
     ============================================================ */
  var charts = {};
  function renderAnalytics() {
    API.getAnalytics().then(function (a) {
      $('an-kpis').innerHTML = [
        { v: a.totals.teamsRegistered, l: 'Teams registered', c: 'v-violet' },
        { v: a.totals.projectsSubmitted, l: 'Projects submitted', c: 'v-mint' },
        { v: a.totals.completionRate + '%', l: 'Registration → submission', c: 'v-gold' },
        { v: a.totals.arenaSolves, l: 'Arena challenges solved', c: 'v-cyan' }
      ].map(kpiHtml).join('');

      var an = document.querySelector('#an-table tbody');
      var rows = SEED_TEAMS.slice().sort(function (x, y) { return y.pts - x.pts; }).slice(0, 8);
      an.innerHTML = rows.map(function (t, i) {
        var rb = i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : '';
        return '<tr><td><span class="rankbadge ' + rb + '">' + (i + 1) + '</span></td><td>' + esc(t.team) + '</td><td class="note">' + esc(t.college) + '</td><td class="note">' + esc(trackName(t.track)) + '</td><td class="pts">' + t.pts + '</td></tr>';
      }).join('');

      if (typeof Chart === 'undefined') return;
      var text = cssVar('--muted'), grid = cssVar('--line');
      var violet = cssVar('--violet'), gold = cssVar('--gold'), mint = cssVar('--mint'), cyan = cssVar('--cyan'), vsoft = cssVar('--violet-soft');
      Chart.defaults.color = text; Chart.defaults.font.family = "'IBM Plex Sans', sans-serif"; Chart.defaults.font.size = 12;
      Object.keys(charts).forEach(function (k) { if (charts[k]) charts[k].destroy(); });

      charts.reg = new Chart($('chartReg'), { type: 'line',
        data: { labels: a.registrations.map(function (r) { return r[0]; }), datasets: [{ label: 'Teams', data: a.registrations.map(function (r) { return r[1]; }), borderColor: violet, backgroundColor: 'color-mix(in srgb, ' + violet + ' 18%, transparent)', fill: true, tension: .35, pointBackgroundColor: violet, pointRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: grid } }, y: { grid: { color: grid }, beginAtZero: true } } } });

      charts.sub = new Chart($('chartSub'), { type: 'line',
        data: { labels: a.submissions.map(function (r) { return r[0]; }), datasets: [{ label: 'Submissions', data: a.submissions.map(function (r) { return r[1]; }), borderColor: mint, backgroundColor: 'color-mix(in srgb, ' + mint + ' 18%, transparent)', fill: true, tension: .3, pointBackgroundColor: mint, pointRadius: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 5 } }, y: { grid: { color: grid }, beginAtZero: true } } } });

      var trackLabels = Object.keys(a.byTrack).map(trackName);
      charts.track = new Chart($('chartTrack'), { type: 'doughnut',
        data: { labels: trackLabels, datasets: [{ data: Object.values(a.byTrack), backgroundColor: [violet, gold, mint, cyan], borderColor: cssVar('--surface'), borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } }, cutout: '58%' } });

      var collegeEntries = Object.entries(a.byCollege).sort(function (x, y) { return y[1] - x[1]; }).slice(0, 6);
      charts.college = new Chart($('chartCollege'), { type: 'bar',
        data: { labels: collegeEntries.map(function (e) { return e[0]; }), datasets: [{ data: collegeEntries.map(function (e) { return e[1]; }), backgroundColor: violet, borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 30, minRotation: 30 } }, y: { grid: { color: grid }, beginAtZero: true } } } });

      charts.engage = new Chart($('chartEngage'), { type: 'bar',
        data: { labels: a.engagement.map(function (r) { return r[0]; }), datasets: [{ data: a.engagement.map(function (r) { return r[1]; }), backgroundColor: cyan, borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, beginAtZero: true } } } });

      var funnel = [
        { label: 'Registered', v: a.totals.teamsRegistered },
        { label: 'Solved ≥1 challenge', v: Math.round(a.totals.teamsRegistered * .58) },
        { label: 'Submitted a project', v: a.totals.projectsSubmitted }
      ];
      charts.funnel = new Chart($('chartFunnel'), { type: 'bar',
        data: { labels: funnel.map(function (f) { return f.label; }), datasets: [{ data: funnel.map(function (f) { return f.v; }), backgroundColor: [violet, vsoft, gold], borderRadius: 6, borderSkipped: false }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: grid }, beginAtZero: true }, y: { grid: { display: false } } } } });
    });
  }

  /* ============================================================
     Init
     ============================================================ */
  populateTrackSelects();
  buildMemberFields();
  renderHome();
  renderRules();
  renderArenaStatic();
  loadChallenge(CHALLENGES[0]);
  renderLeaderboard();
  renderDashboard();
  tickCountdown();
  showView(currentView(), { silent: true, noScroll: true });
})();
