/* ============================================================
   SASTRA University — YouTube Channel Integration
   File: assets/js/youtube.js

   ▸ Auto-fetches the latest videos from SASTRA's YouTube channel
   ▸ No API key required — uses public RSS via rss2json.com
   ▸ Channel ID is auto-discovered once and cached permanently
   ▸ Video list refreshed every 6 hours via localStorage cache
   ▸ Cross-platform: mobile, iOS, tablet, Mac, Windows, Android
   ============================================================ */

(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────── */
  var CFG = {
    handle       : 'strsastrauniversity',
    channelUrl   : 'https://www.youtube.com/@strsastrauniversity',
    maxVideos    : 6,
    cacheTTL     : 6 * 3600 * 1000,   /* 6 hours in ms          */
    slideDuration: 4500,               /* ms per auto-advance    */
    fadeMs       : 250,                /* crossfade duration ms  */
  };

  /* ── DOM references ────────────────────────────────────────── */
  function byId(id) { return document.getElementById(id); }

  var D = {
    loading  : byId('ytLoading'),
    error    : byId('ytError'),
    carousel : byId('ytCarousel'),
    mainThumb: byId('ytMainThumb'),
    mainImg  : byId('ytMainImg'),
    mainTitle: byId('ytMainTitle'),
    thumbs   : byId('ytThumbs'),
    dots     : byId('ytDots'),
    fill     : byId('ytProgressFill'),
    wrap     : document.querySelector('.yt-showcase-wrap')
  };

  if (!D.mainImg) return; /* guard: not on this page */

  /* ── UI state ──────────────────────────────────────────────── */
  function setState(s) {
    D.loading.style.display  = s === 'loading' ? 'flex'  : 'none';
    D.error.style.display    = s === 'error'   ? 'flex'  : 'none';
    D.carousel.style.display = s === 'ready'   ? 'block' : 'none';
  }

  /* ── Load-balance proxy list ──────────────────────────────── */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ── localStorage helpers ──────────────────────────────────── */
  function lsGet(key, ttl) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (ttl && Date.now() - o.ts > ttl) return null;
      return o.val;
    } catch (e) { return null; }
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val: val })); }
    catch (e) {}
  }

  /* ── Step 1: Discover channel ID ──────────────────────────── */
  function getChannelId() {
    var PERM = 'sastra_yt_cid';

    /* Channel IDs never change — cache permanently (no TTL) */
    var cached = localStorage.getItem(PERM);
    if (cached && /^UC/.test(cached)) return Promise.resolve(cached);

    function save(id) { localStorage.setItem(PERM, id); return id; }

    /* Primary: yt.lemnoslife.com — YouTube Data API proxy, no key needed */
    return fetch('https://yt.lemnoslife.com/channels?part=snippet&forHandle=%40' + CFG.handle)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var id = d && d.items && d.items[0] && d.items[0].id;
        if (id && /^UC/.test(id)) return save(id);
        throw new Error('no id');
      })
      .catch(function () {
        /* Fallback: scrape YouTube channel page via load-balanced CORS proxies */
        var ytUrl = 'https://www.youtube.com/@' + CFG.handle;
        var proxies = shuffle([
          'https://corsproxy.io/?' + encodeURIComponent(ytUrl),
          'https://api.allorigins.win/get?url=' + encodeURIComponent(ytUrl)
        ]);

        function tryProxy(i) {
          if (i >= proxies.length) return Promise.reject(new Error('discovery failed'));
          return fetch(proxies[i])
            .then(function (r) { return r.text(); })
            .then(function (raw) {
              /* allorigins wraps response as { contents: "..." } */
              var html = raw;
              try { var j = JSON.parse(raw); html = j.contents || raw; } catch (e) {}
              var m = html.match(/"channelId":"(UC[\w-]{20,})"/) ||
                      html.match(/channel\/(UC[\w-]{20,})/);
              if (!m) throw new Error('id not found in page');
              return save(m[1]);
            })
            .catch(function () { return tryProxy(i + 1); });
        }
        return tryProxy(0);
      });
  }

  /* ── Step 2: Fetch recent videos ──────────────────────────── */
  function fetchVideos(channelId) {
    var CACHE = 'sastra_yt_vids_' + channelId;
    var cached = lsGet(CACHE, CFG.cacheTTL);
    if (cached && cached.length) return Promise.resolve(cached);

    var rss = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId;

    /* Primary: rss2json.com — free (10 k req/day), handles CORS */
    return fetch('https://api.rss2json.com/v1/api.json?rss_url=' +
                 encodeURIComponent(rss) + '&count=' + CFG.maxVideos)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status !== 'ok' || !d.items || !d.items.length) throw new Error('empty');
        var vids = d.items.map(function (item) {
          var m = (item.link || '').match(/v=([^&]+)/);
          return { id: m ? m[1] : '', title: item.title || '' };
        }).filter(function (v) { return v.id; });
        if (!vids.length) throw new Error('no ids');
        lsSet(CACHE, vids);
        return vids;
      })
      .catch(function () {
        /* Fallback: fetch + parse RSS XML directly via load-balanced CORS proxy */
        var proxies = shuffle([
          'https://corsproxy.io/?' + encodeURIComponent(rss),
          'https://api.allorigins.win/get?url=' + encodeURIComponent(rss)
        ]);

        function tryProxy(i) {
          if (i >= proxies.length) return Promise.reject(new Error('RSS failed'));
          return fetch(proxies[i])
            .then(function (r) { return r.text(); })
            .then(function (raw) {
              var xml = raw;
              try { var j = JSON.parse(raw); xml = j.contents || raw; } catch (e) {}
              var doc = new DOMParser().parseFromString(xml, 'text/xml');
              var entries = Array.prototype.slice.call(doc.querySelectorAll('entry'));
              var vids = entries.slice(0, CFG.maxVideos).map(function (entry) {
                /* YouTube XML uses yt:videoId — try both namespace variants */
                var idEl = entry.querySelector('videoId') ||
                  entry.getElementsByTagNameNS(
                    'http://www.youtube.com/xml/schemas/2015', 'videoId'
                  )[0];
                var id    = idEl ? idEl.textContent.trim() : '';
                var title = (entry.querySelector('title') || {}).textContent || '';
                return { id: id, title: title };
              }).filter(function (v) { return v.id; });
              if (!vids.length) throw new Error('no entries');
              lsSet(CACHE, vids);
              return vids;
            })
            .catch(function () { return tryProxy(i + 1); });
        }
        return tryProxy(0);
      });
  }

  /* ── Carousel state ────────────────────────────────────────── */
  var current      = 0;
  var total        = 0;
  var videos       = [];
  var isPaused     = false;
  var timer        = null;
  var slideStarted = 0;   /* Date.now() when current slide timer began */
  var slideLeft    = 0;   /* ms remaining on slide when paused         */

  function thumbUrl(id, hq) {
    return 'https://img.youtube.com/vi/' + id +
           (hq ? '/maxresdefault.jpg' : '/hqdefault.jpg');
  }

  /* ── Progress bar helpers ──────────────────────────────────── */
  function startProgress(ms) {
    D.fill.style.transition = 'none';
    D.fill.style.width = '0%';
    void D.fill.offsetWidth;
    D.fill.style.transition = 'width ' + ms + 'ms linear';
    D.fill.style.width = '100%';
  }

  function freezeProgress() {
    /* Read computed pixel width and lock it (stops the CSS animation) */
    var w  = parseFloat(getComputedStyle(D.fill).width)               || 0;
    var pw = parseFloat(getComputedStyle(D.fill.parentElement).width)  || 1;
    D.fill.style.transition = 'none';
    D.fill.style.width = (w / pw * 100).toFixed(2) + '%';
  }

  function continueProgress(ms) {
    void D.fill.offsetWidth;
    D.fill.style.transition = 'width ' + ms + 'ms linear';
    D.fill.style.width = '100%';
  }

  /* ── Slide transition ──────────────────────────────────────── */
  function goTo(idx) {
    current = ((idx % total) + total) % total;
    var v = videos[current];

    /* Crossfade: fade out → swap src → fade in */
    D.mainImg.style.opacity = '0';
    setTimeout(function () {
      D.mainImg.src = thumbUrl(v.id, true);
      D.mainImg.onerror = function () {
        this.src = thumbUrl(v.id, false);
        this.onerror = null;
      };
      D.mainImg.alt = v.title;
      D.mainImg.style.opacity = '1';
    }, CFG.fadeMs);

    D.mainTitle.textContent = v.title;
    D.mainThumb.dataset.vid = v.id;

    /* Sync thumbnail strip */
    [].forEach.call(D.thumbs.querySelectorAll('.yt-thumb-item'), function (el, i) {
      el.classList.toggle('active', i === current);
    });
    /* Sync dots */
    [].forEach.call(D.dots.querySelectorAll('.yt-dot'), function (el, i) {
      el.classList.toggle('active', i === current);
    });

    /* Scroll only the thumbnail strip horizontally — never scroll the page */
    var active = D.thumbs.querySelectorAll('.yt-thumb-item')[current];
    if (active) {
      D.thumbs.scrollTo({
        left: active.offsetLeft - (D.thumbs.offsetWidth / 2) + (active.offsetWidth / 2),
        behavior: 'smooth'
      });
    }
  }

  /* ── Autoplay engine ───────────────────────────────────────── */
  function scheduleNext(ms) {
    clearTimeout(timer);
    slideStarted = Date.now();
    timer = setTimeout(function () {
      goTo(current + 1);
      startProgress(CFG.slideDuration);
      scheduleNext(CFG.slideDuration);
    }, ms);
  }

  function pause() {
    if (isPaused) return;
    isPaused = true;
    slideLeft = Math.max(0, CFG.slideDuration - (Date.now() - slideStarted));
    clearTimeout(timer);
    freezeProgress();
  }

  function resume() {
    if (!isPaused) return;
    isPaused = false;
    var rem = slideLeft > 0 ? slideLeft : CFG.slideDuration;
    continueProgress(rem);
    scheduleNext(rem);
  }

  function startAutoplay() {
    startProgress(CFG.slideDuration);
    scheduleNext(CFG.slideDuration);
  }

  /* ── Build carousel ────────────────────────────────────────── */
  function buildCarousel(vids) {
    videos = vids;
    total  = videos.length;
    if (!total) { setState('error'); return; }

    /* Enable opacity crossfade on the main image */
    D.mainImg.style.transition = 'opacity ' + CFG.fadeMs + 'ms ease';

    /* Render thumbnail strip and dot navigation */
    D.thumbs.innerHTML = '';
    D.dots.innerHTML   = '';

    videos.forEach(function (v, i) {
      /* Thumbnail */
      var item = document.createElement('div');
      item.className     = 'yt-thumb-item';
      item.dataset.index = i;
      item.setAttribute('role', 'listitem');
      var img = document.createElement('img');
      img.src     = thumbUrl(v.id, false);
      img.alt     = v.title;
      img.loading = 'lazy';
      item.appendChild(img);
      D.thumbs.appendChild(item);

      /* Dot */
      var dot = document.createElement('button');
      dot.className = 'yt-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Video ' + (i + 1) + ': ' + v.title);
      dot.dataset.index = i;
      D.dots.appendChild(dot);
    });

    /* ── Events ── */

    /* Thumbnail strip click */
    D.thumbs.addEventListener('click', function (e) {
      var item = e.target.closest('.yt-thumb-item');
      if (!item) return;
      goTo(+item.dataset.index);
      startProgress(CFG.slideDuration);
      scheduleNext(CFG.slideDuration);
    });

    /* Dot navigation click */
    D.dots.addEventListener('click', function (e) {
      var dot = e.target.closest('.yt-dot');
      if (!dot) return;
      goTo(+dot.dataset.index);
      startProgress(CFG.slideDuration);
      scheduleNext(CFG.slideDuration);
    });

    /* Main thumbnail click → open video on YouTube */
    D.mainThumb.addEventListener('click', function () {
      window.open(
        'https://www.youtube.com/watch?v=' + (this.dataset.vid || videos[current].id),
        '_blank', 'noopener,noreferrer'
      );
    });

    /* Keyboard: Enter/Space = open, Arrow = navigate */
    D.mainThumb.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); startProgress(CFG.slideDuration); scheduleNext(CFG.slideDuration); }
      if (e.key === 'ArrowLeft')  { goTo(current - 1); startProgress(CFG.slideDuration); scheduleNext(CFG.slideDuration); }
    });

    /* Pause on hover / focus — progress bar freezes too */
    D.wrap.addEventListener('mouseenter', pause);
    D.wrap.addEventListener('mouseleave', resume);
    D.wrap.addEventListener('focusin',    pause);
    D.wrap.addEventListener('focusout',   resume);

    /* Touch swipe on main display (iOS, Android) */
    var tx = 0, ty = 0;
    D.mainThumb.addEventListener('touchstart', function (e) {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }, { passive: true });

    D.mainThumb.addEventListener('touchend', function (e) {
      var dx = tx - e.changedTouches[0].clientX;
      var dy = ty - e.changedTouches[0].clientY;
      /* Only trigger on horizontal swipe; ignore vertical scroll */
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx > 0 ? current + 1 : current - 1);
        startProgress(CFG.slideDuration);
        scheduleNext(CFG.slideDuration);
      }
    }, { passive: true });

    /* Page visibility — pause when tab is hidden, resume when visible */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { pause(); } else { resume(); }
    });

    /* Slow down for users who prefer reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      CFG.slideDuration = 9000;
      CFG.fadeMs = 0;
      D.mainImg.style.transition = 'none';
    }

    setState('ready');
    goTo(0);
    startAutoplay();
  }

  /* ── Boot ──────────────────────────────────────────────────── */
  setState('loading');

  getChannelId()
    .then(fetchVideos)
    .then(buildCarousel)
    .catch(function () { setState('error'); });

}());
