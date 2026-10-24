/* =========================================================
   FleekZy CV — interacciones
   Sin dependencias. Funciona abriendo index.html directamente
   o desde cualquier hosting estático (GitHub Pages, Netlify…).
   ========================================================= */
(function () {
  'use strict';

  var CONFIG = {
    // Vídeo de fondo opcional, p.ej. 'assets/video/bg.mp4'.
    // Vacío = se usa el fondo animado generado por código.
    bgVideo: '',
    // Volumen inicial de la música (0-100) si el visitante no lo ha cambiado antes.
    musicVolume: 30
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Año del footer ---------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- Menú móvil ---------- */
  function initMenu() {
    var btn = $('[data-menu-toggle]');
    var menu = $('#mobile-menu');
    if (!btn || !menu) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      if ('inert' in menu) menu.inert = !open;
      document.documentElement.classList.toggle('menu-open', open);
    }

    setOpen(false);
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });
    var desktop = window.matchMedia('(min-width: 1024px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* ---------- Enlace activo según la sección visible ---------- */
  function initScrollSpy() {
    var links = $$('[data-nav] a[href^="#"]');
    var ids = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!sections.length) return;

    var current = '';
    var lockUntil = 0;
    var ticking = false;
    function setActive(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    // Activa la última sección cuyo borde superior ha pasado el 35% de la pantalla.
    function update() {
      ticking = false;
      if (Date.now() < lockUntil) return;
      var line = window.innerHeight * 0.35;
      var id = sections[0].id;
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= line) id = s.id;
      });
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) id = sections[sections.length - 1].id;
      setActive(id);
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);

    // Al pulsar un enlace se marca ese, aunque la sección no llegue arriba del todo.
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        setActive(a.getAttribute('href').slice(1));
        lockUntil = Date.now() + 1000;
      });
    });

    update();
  }

  /* ---------- Animación de entrada ---------- */
  function revealAll() {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
  }

  function initReveal() {
    var els = $$('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) { revealAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Tarjeta con inclinación 3D ---------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    $$('[data-tilt]').forEach(function (wrap) {
      var card = wrap.firstElementChild;
      if (!card) return;
      var MAX_X = 6, MAX_Y = 8;
      var raf = 0, px = 0.5, py = 0.5;

      function apply() {
        raf = 0;
        card.style.transform =
          'rotateX(' + ((0.5 - py) * MAX_X * 2).toFixed(2) + 'deg) ' +
          'rotateY(' + ((px - 0.5) * MAX_Y * 2).toFixed(2) + 'deg)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }

      wrap.addEventListener('pointermove', function (e) {
        var r = wrap.getBoundingClientRect();
        px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        card.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(apply);
      });

      wrap.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  }

  /* ---------- Reproductor de música ----------
     Usa los vídeos oficiales de YouTube (IFrame API) con controles propios.
     El vídeo queda visible en la tarjeta, como exigen las normas de YouTube. */
  var MUSIC_KEY = 'fleekzy-music';

  function loadMusicPrefs() {
    try { return JSON.parse(localStorage.getItem(MUSIC_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveMusicPrefs(p) {
    try { localStorage.setItem(MUSIC_KEY, JSON.stringify(p)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function fmtTime(s) {
    s = Math.max(0, Math.floor(s || 0));
    var r = s % 60;
    return Math.floor(s / 60) + ':' + (r < 10 ? '0' : '') + r;
  }

  function loadYouTubeAPI(done) {
    if (window.YT && window.YT.Player) { done(true); return; }
    var finished = false;
    function finish(ok) { if (!finished) { finished = true; done(ok); } }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      finish(true);
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { finish(false); };
    document.head.appendChild(s);
    setTimeout(function () { finish(!!(window.YT && window.YT.Player)); }, 15000);
  }

  function initMusic() {
    var root = $('[data-player]');
    if (!root) return;
    var tracks = $$('[data-track]', root).map(function (li) {
      return {
        id: li.getAttribute('data-youtube'),
        title: li.textContent.trim(),
        length: parseInt(li.getAttribute('data-length'), 10) || 0,
        failed: false
      };
    }).filter(function (t) { return t.id; });
    if (!tracks.length) return;

    var el = {
      mount: $('[data-player-mount]', root),
      title: $('[data-player-title]', root),
      index: $('[data-player-index]', root),
      current: $('[data-player-current]', root),
      duration: $('[data-player-duration]', root),
      bar: $('[data-player-bar]', root),
      fill: $('[data-player-fill]', root),
      play: $('[data-player-play]', root),
      prev: $('[data-player-prev]', root),
      next: $('[data-player-next]', root),
      mute: $('[data-player-mute]', root),
      volume: $('[data-player-volume]', root),
      status: $('[data-player-status]', root),
      hint: $('[data-music-hint]')
    };

    var prefs = loadMusicPrefs();
    var volume = typeof prefs.volume === 'number' ? prefs.volume : CONFIG.musicVolume;
    var muted = !!prefs.muted;
    var userPaused = !!prefs.paused; // si el visitante pausó, no vuelve a sonar solo
    var index = 0;
    var player = null;
    var ready = false;
    var playing = false;
    var wantPlay = false;
    var ticker = 0;
    var dragging = false;
    var gestureArmed = false;

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function persist() { saveMusicPrefs({ volume: volume, muted: muted, paused: userPaused }); }
    function setState(s) { root.setAttribute('data-state', s); }
    function showHint(show) { if (el.hint) el.hint.hidden = !show; }

    function setStatus(text, href, linkText) {
      el.status.textContent = text || '';
      if (href) {
        var a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = linkText;
        el.status.appendChild(document.createTextNode(' '));
        el.status.appendChild(a);
      }
    }

    function renderMeta() {
      var t = tracks[index];
      el.title.textContent = t.title;
      el.title.title = t.title;
      el.index.textContent = pad(index + 1) + ' / ' + pad(tracks.length);
    }

    function renderTime(cur, dur) {
      var known = dur > 0;
      el.fill.style.width = (known ? Math.min(100, (cur / dur) * 100) : 0) + '%';
      el.current.textContent = fmtTime(cur);
      el.duration.textContent = known ? fmtTime(dur) : '--:--';
      el.bar.setAttribute('aria-valuemax', String(Math.round(dur || 0)));
      el.bar.setAttribute('aria-valuenow', String(Math.round(cur || 0)));
      el.bar.setAttribute('aria-valuetext', fmtTime(cur) + ' de ' + (known ? fmtTime(dur) : '--:--'));
    }

    // Duración real de YouTube o, mientras no la da, la indicada en data-length.
    function getDur() {
      var d = ready ? player.getDuration() : 0;
      return d > 0 ? d : tracks[index].length;
    }

    function tick() {
      if (!ready || dragging) return;
      renderTime(player.getCurrentTime(), getDur());
    }
    function startTicker() { if (!ticker) ticker = setInterval(tick, 250); }
    function stopTicker() { clearInterval(ticker); ticker = 0; }

    function setPlayIcon(isPlaying) {
      el.play.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
      var use = el.play.querySelector('use');
      if (use) use.setAttribute('href', isPlaying ? '#i-pause' : '#i-play');
    }

    function renderVolume() {
      el.volume.value = String(volume);
      var off = muted || volume === 0;
      el.mute.setAttribute('aria-label', off ? 'Activar sonido' : 'Silenciar');
      var use = el.mute.querySelector('use');
      if (use) use.setAttribute('href', off ? '#i-volume-x' : '#i-volume');
    }

    function applyVolume() {
      if (!ready) return;
      player.setVolume(volume);
      if (muted) player.mute(); else player.unMute();
    }

    function play() {
      wantPlay = true;
      userPaused = false;
      persist();
      if (!ready) return; // sonará en cuanto cargue el reproductor
      applyVolume();
      player.playVideo();
      // Algunos móviles (iOS) solo dejan arrancar tocando el propio vídeo.
      setTimeout(function () {
        if (!wantPlay || userPaused || playing) return;
        var st = player.getPlayerState();
        if (st !== window.YT.PlayerState.PLAYING && st !== window.YT.PlayerState.BUFFERING) {
          setStatus('Toca el vídeo para empezar a escuchar.');
        }
      }, 2000);
    }

    function pause() {
      wantPlay = false;
      userPaused = true;
      persist();
      showHint(false);
      disarmGesture();
      if (ready) player.pauseVideo();
    }

    function load(i, autoplay) {
      index = (i + tracks.length) % tracks.length;
      renderMeta();
      renderTime(0, tracks[index].length);
      if (!ready) return;
      if (autoplay) {
        wantPlay = true;
        userPaused = false;
        persist();
        applyVolume();
        player.loadVideoById(tracks[index].id);
      } else {
        player.cueVideoById(tracks[index].id);
      }
    }

    function next(autoplay) { load(index + 1, autoplay); }

    function prev() {
      if (ready && player.getCurrentTime() > 3) {
        player.seekTo(0, true);
        tick();
        return;
      }
      load(index - 1, true);
    }

    // Los navegadores no dejan sonar audio hasta que el visitante interactúa:
    // la música arranca con el primer clic, toque o tecla en cualquier parte.
    var GESTURES = ['pointerdown', 'keydown', 'touchend'];
    function onGesture(e) {
      // Los controles del reproductor ya actúan por sí mismos.
      if (e && e.target && e.target.closest && e.target.closest('[data-player]')) return;
      disarmGesture();
      if (!userPaused) play();
    }
    function armGesture() {
      if (gestureArmed) return;
      gestureArmed = true;
      GESTURES.forEach(function (t) { document.addEventListener(t, onGesture, true); });
    }
    function disarmGesture() {
      if (!gestureArmed) return;
      gestureArmed = false;
      GESTURES.forEach(function (t) { document.removeEventListener(t, onGesture, true); });
    }

    function tryAutoplay() {
      if (userPaused) {
        setStatus('En pausa. Pulsa ▶ para escuchar.');
        return;
      }
      wantPlay = true;
      applyVolume();
      player.playVideo();

      function blocked() {
        showHint(true);
        armGesture();
        setStatus('Pulsa en cualquier parte de la página para escuchar.');
      }

      // Si en ~4 s no está sonando, el navegador lo ha bloqueado: se espera al primer clic.
      var waited = 0;
      function check() {
        if (!ready || userPaused) return;
        if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
          if (player.isMuted() && !muted) { // arrancó en silencio: mejor empezar desde el principio con sonido
            player.pauseVideo();
            player.seekTo(0, true);
            blocked();
          }
          return; // el navegador permitió el sonido
        }
        waited += 1000;
        if (waited < 4000) setTimeout(check, 1000);
        else blocked();
      }
      setTimeout(check, 1000);
    }

    function onReady() {
      ready = true;
      [el.play, el.prev, el.next, el.mute, el.volume].forEach(function (b) { b.disabled = false; });
      applyVolume();
      setState('paused');
      setStatus('');
      tryAutoplay();
    }

    function onStateChange(e) {
      var S = window.YT.PlayerState;
      if (e.data === S.PLAYING) {
        playing = true;
        setState('playing');
        setPlayIcon(true);
        startTicker();
        showHint(false);
        disarmGesture();
        setStatus('');
      } else if (e.data === S.PAUSED || e.data === S.CUED) {
        playing = false;
        setState('paused');
        setPlayIcon(false);
        stopTicker();
        tick();
      } else if (e.data === S.BUFFERING) {
        setState('buffering');
      } else if (e.data === S.ENDED) {
        playing = false;
        stopTicker();
        next(true);
      }
    }

    function onError() {
      var t = tracks[index];
      t.failed = true;
      var url = 'https://www.youtube.com/watch?v=' + t.id;
      if (tracks.some(function (x) { return !x.failed; })) {
        setStatus('“' + t.title + '” no se puede reproducir aquí.', url, 'Escúchala en YouTube');
        next(wantPlay);
      } else {
        stopTicker();
        setState('error');
        showHint(false);
        disarmGesture();
        setStatus('No se pudo reproducir la música aquí.', url, 'Escúchala en YouTube');
      }
    }

    function createPlayer() {
      var vars = { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1, rel: 0 };
      if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
      player = new window.YT.Player(el.mount, {
        host: 'https://www.youtube-nocookie.com',
        width: '200',
        height: '200',
        videoId: tracks[0].id,
        playerVars: vars,
        events: { onReady: onReady, onStateChange: onStateChange, onError: onError }
      });
    }

    // Controles
    el.play.addEventListener('click', function () { if (playing) pause(); else play(); });
    el.prev.addEventListener('click', prev);
    el.next.addEventListener('click', function () { next(true); });
    el.mute.addEventListener('click', function () {
      if (muted || volume === 0) {
        muted = false;
        if (volume === 0) volume = CONFIG.musicVolume;
      } else {
        muted = true;
      }
      applyVolume();
      renderVolume();
      persist();
    });
    el.volume.addEventListener('input', function () {
      volume = parseInt(el.volume.value, 10) || 0;
      muted = volume === 0;
      applyVolume();
      renderVolume();
      persist();
    });
    if (el.hint) el.hint.addEventListener('click', play);

    // Barra de progreso: clic o arrastre para saltar; flechas del teclado ±5 s
    function fracFromEvent(e) {
      var r = el.bar.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    }
    function endDrag(e, commit) {
      if (!dragging) return;
      dragging = false;
      el.bar.classList.remove('is-dragging');
      if (commit) player.seekTo(fracFromEvent(e) * getDur(), true);
      tick();
    }
    el.bar.addEventListener('pointerdown', function (e) {
      if (!ready || !(getDur() > 0)) return;
      dragging = true;
      el.bar.classList.add('is-dragging');
      try { el.bar.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      renderTime(fracFromEvent(e) * getDur(), getDur());
    });
    el.bar.addEventListener('pointermove', function (e) {
      if (dragging) renderTime(fracFromEvent(e) * getDur(), getDur());
    });
    el.bar.addEventListener('pointerup', function (e) { endDrag(e, true); });
    el.bar.addEventListener('pointercancel', function (e) { endDrag(e, false); });
    el.bar.addEventListener('keydown', function (e) {
      if (!ready) return;
      var d = getDur();
      if (!(d > 0)) return;
      var c = player.getCurrentTime();
      var t = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = c + 5;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = c - 5;
      else if (e.key === 'Home') t = 0;
      else if (e.key === 'End') t = d - 1;
      if (t === null) return;
      e.preventDefault();
      t = Math.max(0, Math.min(d, t));
      player.seekTo(t, true);
      renderTime(t, d);
    });

    renderMeta();
    renderTime(0, tracks[0].length);
    renderVolume();

    // YouTube no permite reproducir vídeos insertados en páginas abiertas como archivo local.
    if (location.protocol === 'file:') {
      setState('error');
      setStatus('Para escuchar la música abre la web desde un servidor o desde GitHub Pages.');
      return;
    }

    loadYouTubeAPI(function (ok) {
      if (!ok || !el.mount) {
        setState('error');
        setStatus('No se pudo cargar el reproductor.', 'https://www.youtube.com/watch?v=' + tracks[0].id, 'Escúchala en YouTube');
        return;
      }
      try {
        createPlayer();
      } catch (err) {
        setState('error');
        setStatus('No se pudo cargar el reproductor.');
      }
    });
  }

  /* ---------- Impresión de la web: mostrar todo lo que aún no ha aparecido ---------- */
  function initPrint() {
    window.addEventListener('beforeprint', revealAll);
  }

  /* ---------- Fondo: bosque con niebla y ceniza ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawPine(c, x, base, h) {
    var w = h * 0.4;
    var tiers = 6;
    c.beginPath();
    for (var i = 0; i < tiers; i++) {
      var t = i / tiers;
      var top = base - h + h * t * 0.78;
      var bottom = top + h * 0.3;
      var half = w * (0.16 + t * 0.5);
      c.moveTo(x, top);
      c.lineTo(x + half, bottom);
      c.lineTo(x - half, bottom);
      c.closePath();
    }
    c.rect(x - w * 0.04, base - h * 0.16, w * 0.08, h * 0.17);
    c.fill();
  }

  function drawPineLayer(c, rand, w, h, o) {
    c.save();
    c.fillStyle = o.color;
    if (o.blur) c.filter = 'blur(' + o.blur + 'px)';
    var count = Math.max(6, Math.ceil(w / o.spacing));
    for (var i = 0; i < count; i++) {
      var x;
      if (o.edges) {
        var side = rand() < 0.5;
        x = side ? rand() * w * 0.28 : w - rand() * w * 0.28;
      } else {
        x = (i + rand() * 0.8) * (w / count);
      }
      var th = o.minH + rand() * (o.maxH - o.minH);
      drawPine(c, x, o.base + rand() * h * 0.02, th);
    }
    c.fillRect(0, o.base - 1, w, h - o.base + 2);
    c.restore();
  }

  function drawBranch(c, rand, x, y, len, angle, width, depth) {
    if (depth <= 0 || len < 3) return;
    var x2 = x + Math.cos(angle) * len;
    var y2 = y + Math.sin(angle) * len;
    var mx = (x + x2) / 2 + (rand() - 0.5) * len * 0.25;
    var my = (y + y2) / 2 + (rand() - 0.5) * len * 0.25;
    c.lineWidth = Math.max(0.6, width);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(mx, my, x2, y2);
    c.stroke();
    var n = rand() < 0.28 ? 3 : 2;
    for (var i = 0; i < n; i++) {
      drawBranch(c, rand, x2, y2,
        len * (0.6 + rand() * 0.2),
        angle + (rand() - 0.5) * 1.15,
        width * 0.66,
        depth - 1);
    }
  }

  function initBackground() {
    var bg = $('.bg');
    var scene = $('#bg-scene');
    var fx = $('#bg-fx');
    if (!bg || !scene || !scene.getContext) return;
    var sctx = scene.getContext('2d');
    var fctx = fx && fx.getContext ? fx.getContext('2d') : null;
    if (!sctx) return;

    var drawnW = 0, drawnH = 0;

    function drawScene() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var r = Math.min(window.devicePixelRatio || 1, 1.5);
      drawnW = w; drawnH = h;
      scene.width = Math.round(w * r);
      scene.height = Math.round(h * r);
      var c = sctx;
      c.setTransform(r, 0, 0, r, 0, 0);
      var rand = mulberry32(1337);

      // Cielo
      var sky = c.createRadialGradient(w * 0.55, h * 0.36, 0, w * 0.55, h * 0.36, Math.max(w, h) * 0.85);
      sky.addColorStop(0, '#4b4b4b');
      sky.addColorStop(0.22, '#2a2a2a');
      sky.addColorStop(0.55, '#0f0f0f');
      sky.addColorStop(1, '#020202');
      c.fillStyle = sky;
      c.fillRect(0, 0, w, h);

      // Nubes
      var scale = Math.max(0.5, w / 1440);
      for (var i = 0; i < 60; i++) {
        var cx = rand() * w;
        var cy = h * (0.04 + rand() * 0.6);
        var cr = (70 + rand() * 260) * scale;
        var a = 0.02 + rand() * 0.06;
        var g = c.createRadialGradient(cx, cy, 0, cx, cy, cr);
        g.addColorStop(0, 'rgba(215,215,215,' + a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(215,215,215,0)');
        c.fillStyle = g;
        c.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }

      // Pinos lejanos
      drawPineLayer(c, rand, w, h, {
        base: h * 0.84, minH: h * 0.1, maxH: h * 0.24,
        spacing: 22, color: '#171717', blur: 3
      });

      // Bruma
      var mist = c.createLinearGradient(0, h * 0.58, 0, h);
      mist.addColorStop(0, 'rgba(130,130,130,0)');
      mist.addColorStop(0.45, 'rgba(130,130,130,0.12)');
      mist.addColorStop(1, 'rgba(30,30,30,0)');
      c.fillStyle = mist;
      c.fillRect(0, h * 0.58, w, h * 0.42);

      // Pinos cercanos (en los laterales)
      drawPineLayer(c, rand, w, h, {
        base: h * 0.99, minH: h * 0.18, maxH: h * 0.36,
        spacing: 70, color: '#0a0a0a', blur: 1, edges: true
      });

      // Suelo
      var ground = c.createLinearGradient(0, h * 0.8, 0, h);
      ground.addColorStop(0, 'rgba(0,0,0,0)');
      ground.addColorStop(1, 'rgba(0,0,0,0.95)');
      c.fillStyle = ground;
      c.fillRect(0, h * 0.8, w, h * 0.2);

      // Árboles desnudos en los bordes (más pequeños en pantallas estrechas)
      var unit = Math.min(h, w * 0.95);
      var s = Math.max(0.35, unit / 900);
      var depth = w < 600 ? 8 : 9;
      c.strokeStyle = '#060606';
      c.lineCap = 'round';
      drawBranch(c, rand, w * 0.015, h + 4, unit * 0.2, -Math.PI / 2 + 0.16, 22 * s, depth);
      drawBranch(c, rand, w * 0.985, h + 4, unit * 0.22, -Math.PI / 2 - 0.2, 24 * s, depth);
      if (w > 900) {
        drawBranch(c, rand, w * 0.11, h + 4, unit * 0.13, -Math.PI / 2 + 0.08, 12 * s, 8);
        drawBranch(c, rand, w * 0.9, h + 4, unit * 0.12, -Math.PI / 2 - 0.06, 11 * s, 8);
      }
    }

    // Partículas de ceniza
    var parts = [];
    var fxW = 0, fxH = 0, last = 0, running = false;

    function spawn(anywhere) {
      var fromLeft = !anywhere && Math.random() < 0.35;
      return {
        x: anywhere ? Math.random() * fxW : (fromLeft ? -10 : Math.random() * fxW),
        y: anywhere ? Math.random() * fxH : (fromLeft ? Math.random() * fxH : -10),
        r: 0.5 + Math.random() * 1.7,
        vx: 8 + Math.random() * 22,
        vy: 12 + Math.random() * 30,
        ph: Math.random() * Math.PI * 2,
        ps: 0.4 + Math.random() * 1.2,
        a: 0.12 + Math.random() * 0.45,
        red: Math.random() < 0.14
      };
    }

    function drawFx() {
      fctx.clearRect(0, 0, fxW, fxH);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        fctx.beginPath();
        fctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        fctx.fillStyle = p.red
          ? 'rgba(255,60,60,' + p.a.toFixed(2) + ')'
          : 'rgba(215,215,215,' + p.a.toFixed(2) + ')';
        fctx.fill();
      }
    }

    function sizeFx() {
      if (!fctx) return;
      var r = Math.min(window.devicePixelRatio || 1, 2);
      fxW = window.innerWidth;
      fxH = window.innerHeight;
      fx.width = Math.round(fxW * r);
      fx.height = Math.round(fxH * r);
      fctx.setTransform(r, 0, 0, r, 0, 0);
      var n = fxW < 768 ? 26 : 56;
      while (parts.length < n) parts.push(spawn(true));
      parts.length = n;
      drawFx();
    }

    function tick(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.ph += p.ps * dt;
        p.x += (p.vx + Math.sin(p.ph) * 14) * dt;
        p.y += p.vy * dt;
        if (p.y > fxH + 10 || p.x > fxW + 10) parts[i] = spawn(false);
      }
      drawFx();
      requestAnimationFrame(tick);
    }

    function start() {
      if (running || reduceMotion || !fctx) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
    function stop() { running = false; }

    drawScene();
    sizeFx();
    start();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    var resizeT = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        var w = window.innerWidth, h = window.innerHeight;
        // En móvil la barra del navegador cambia la altura: solo redibuja si el cambio es grande.
        if (w !== drawnW || Math.abs(h - drawnH) > drawnH * 0.2) drawScene();
        sizeFx();
      }, 150);
    });

    if (CONFIG.bgVideo) {
      var v = document.createElement('video');
      v.className = 'bg-video';
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('muted', '');
      v.preload = 'auto';
      v.addEventListener('playing', function () { v.classList.add('is-ready'); }, { once: true });
      v.addEventListener('error', function () { v.remove(); }, { once: true });
      v.src = CONFIG.bgVideo;
      bg.insertBefore(v, $('.bg-fog', bg));
    }
  }

  /* ---------- Inicio ---------- */
  function init() {
    initYear();
    initMenu();
    initScrollSpy();
    initReveal();
    initTilt();
    initMusic();
    initPrint();
    initBackground();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
