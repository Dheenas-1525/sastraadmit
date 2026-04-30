(function () {
  'use strict';

  // ── Inject real src from data-src so the browser starts fetching ──
  function loadVideoSources(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = 'true';

    video.querySelectorAll('source[data-src]').forEach(function (src) {
      src.setAttribute('src', src.getAttribute('data-src'));
      src.removeAttribute('data-src');
    });
    video.load(); // tell the browser to pick up the new sources
  }

  // ── Pause & reset every video except the one now playing ──
  function stopOthers(current) {
    document.querySelectorAll('.dean-video-wrapper video').forEach(function (v) {
      if (v !== current && !v.paused) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }

  // ── Hide the play overlay once a video has real sources ──
  function hideOverlay(video) {
    var overlay = video.parentElement.querySelector('.dean-play-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ── Intersection Observer: load sources when card is 200 px away ──
  function setupLazyLoad(videos) {
    if (!('IntersectionObserver' in window)) {
      // Fallback for very old browsers — load everything immediately
      videos.forEach(loadVideoSources);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadVideoSources(entry.target);
          observer.unobserve(entry.target); // load once, then stop watching
        }
      });
    }, { rootMargin: '200px' }); // start fetching 200 px before it enters view

    videos.forEach(function (v) { observer.observe(v); });
  }

  // ── Play-overlay tap/click: load + play immediately ──
  function setupOverlayTap(videos) {
    videos.forEach(function (video) {
      var overlay = video.parentElement.querySelector('.dean-play-overlay');
      if (!overlay) return;

      overlay.addEventListener('click', function () {
        loadVideoSources(video);
        hideOverlay(video);
        stopOthers(video);
        video.play();
      });

      // Also hide overlay when native controls start the video
      video.addEventListener('play', function () {
        hideOverlay(video);
        stopOthers(video);
      });
    });
  }

  function init() {
    var videos = Array.prototype.slice.call(
      document.querySelectorAll('.dean-video-wrapper video')
    );
    if (!videos.length) return;

    setupLazyLoad(videos);
    setupOverlayTap(videos);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
