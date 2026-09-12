(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = [...nav.querySelectorAll('a')];

  // Mobile menu (with a dimming overlay over the rest of the page)
  const overlay = document.querySelector('.nav-overlay');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    overlay.classList.toggle('visible', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Header rule + active nav link, recalculated at most once per frame.
  // The active section is the last one whose top has passed a line just
  // below the header, so exactly one link is ever highlighted.
  const sections = [...document.querySelectorAll('main section[id]')];
  const setActive = hash => navLinks.forEach(a => a.classList.toggle('active', a.hash === hash));

  let ticking = false;
  let locked = false;   // true while an in-page link click is smooth-scrolling
  let unlockTimer;

  const update = () => {
    ticking = false;
    header.classList.toggle('scrolled', window.scrollY > 8);
    if (locked) return;

    const line = header.offsetHeight + window.innerHeight * 0.3;
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) current = s;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    setActive('#' + (atBottom ? sections[sections.length - 1] : current).id);
  };

  // Release the lock once scrolling has been quiet for a moment
  const scheduleUnlock = () => {
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => { locked = false; update(); }, 150);
  };

  window.addEventListener('scroll', () => {
    if (locked) scheduleUnlock();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  // On any in-page link click, highlight the destination right away and hold
  // it there, instead of flicking through every section scrolled past.
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    setMenu(false);
    setActive(link.hash);
    locked = true;
    scheduleUnlock();
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Contact form
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  const show = (msg, isError = false) => {
    status.textContent = msg;
    status.classList.toggle('error', isError);
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements._gotcha.value) return;

    if (form.action.includes('YOUR_FORM_ID')) {
      show('The contact form is not connected yet. Please check back soon.', true);
      return;
    }

    button.disabled = true;
    show('Sending…');
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      show('Thank you. Your message has been sent.');
    } catch {
      show('Something went wrong. Please try again in a moment.', true);
    } finally {
      button.disabled = false;
    }
  });
})();
