/* ============================================================
   SASTRA English Page – campus dropdown, school cards, modal,
   dynamic word rotator
   ============================================================ */

/* ── Mobile nav toggle ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

/* ── Dynamic word rotator ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  const words = [
    'Apply, Explore',
    'Study, Investigate',
    'Code, Engineer',
    'Learn, Evolve',
    'Make, Design',
    'Create, Innovate',
  ];
  let index = 0;
  const el = document.getElementById('dynamic-word');
  if (!el) return;

  setInterval(() => {
    el.classList.add('fade-out');
    setTimeout(() => {
      index = (index + 1) % words.length;
      el.textContent = words[index];
      el.classList.remove('fade-out');
      el.classList.add('fade-in');
    }, 400);
  }, 3000);
});

/* ── Nav hide on scroll (active only after campus is selected) ─ */
let campusSelected = false;

window.addEventListener('scroll', function () {
  if (!campusSelected) return;
  const nav = document.querySelector('nav');
  nav.classList.toggle('nav--hidden', window.scrollY > 120);
}, { passive: true });

/* ── Campus dropdown – navigate to schools page ────────────── */
const campusDropdown = document.getElementById('campus-dropdown');
if (campusDropdown) {
  campusDropdown.addEventListener('change', function () {
    if (this.value === 'thanjavur') {
      window.location.href = 'schools.html';
    }
  });
}

/* ── School card tap-to-reveal (mobile) ────────────────────── */
document.querySelectorAll('.school-card').forEach((card) => {
  let touchMoved = false;

  card.addEventListener('touchstart', function () {
    touchMoved = false;
  }, { passive: true });

  card.addEventListener('touchmove', function () {
    touchMoved = true;
  }, { passive: true });

  card.addEventListener('touchend', function (e) {
    if (touchMoved) return;
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const isActive = this.classList.contains('active');
    document.querySelectorAll('.school-card').forEach((c) => c.classList.remove('active'));
    if (!isActive) this.classList.add('active');
  });

  card.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') return;
    if ('ontouchstart' in window) return; // handled by touchend on touch devices
    const isActive = this.classList.contains('active');
    document.querySelectorAll('.school-card').forEach((c) => c.classList.remove('active'));
    if (!isActive) this.classList.add('active');
  });
});

/* ── B.Tech modal ──────────────────────────────────────────── */
// function openBtechModal() {
//   document.getElementById('btech-modal').style.display = 'block';
//   document.body.style.overflow = 'hidden';
// }
function openBtechModal() {
  const modal = document.getElementById('btech-modal');
  modal.style.display = 'flex'; // Changed from 'block' to 'flex' for better centering
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  document.body.style.overflow = 'hidden';
}

function closeBtechModal() {
  document.getElementById('btech-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('programmes-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('click', function (event) {
  const modal = document.getElementById('btech-modal');
  if (event.target === modal) closeBtechModal();
});

/* ── prog-card touch reveal ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.prog-card').forEach(function (card) {
    card.addEventListener('touchstart', function (e) {
      const alreadyTouched = card.classList.contains('touched');
      document.querySelectorAll('.prog-card.touched').forEach(function (c) {
        c.classList.remove('touched');
      });
      if (!alreadyTouched) {
        card.classList.add('touched');
        e.preventDefault();
      }
    }, { passive: false });
  });

  document.addEventListener('touchstart', function (e) {
    if (!e.target.closest('.prog-card')) {
      document.querySelectorAll('.prog-card.touched').forEach(function (c) {
        c.classList.remove('touched');
      });
    }
  });
});
