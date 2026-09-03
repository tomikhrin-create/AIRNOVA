document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu drawer
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const navEl = document.querySelector('nav');
  function positionMobileMenu() {
    if (!mobileMenu) return;
    // nav is position:sticky, so its live bounding rect already reflects
    // where the visible header currently ends — including when the (non-sticky)
    // promo bar above it has been scrolled out of view.
    const headerH = navEl ? navEl.getBoundingClientRect().bottom : 0;
    mobileMenu.style.top = Math.max(headerH, 0) + 'px';
  }
  if (navToggle && mobileMenu) {
    positionMobileMenu();
    window.addEventListener('resize', positionMobileMenu);
    navToggle.addEventListener('click', () => {
      positionMobileMenu();
      const isOpen = mobileMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  // Search dropdown
  const searchBtn = document.getElementById('searchBtn');
  const searchDropdown = document.getElementById('searchDropdown');
  if (searchBtn && searchDropdown) {
    searchBtn.addEventListener('click', e => { e.stopPropagation(); searchDropdown.classList.toggle('open'); });
    document.addEventListener('click', () => searchDropdown.classList.remove('open'));
  }

  // Calculator hint icons in "Co děláme" mobile cards — tap to reveal answer + link
  document.querySelectorAll('.ssp-calc-icon-btn').forEach(btn => {
    const answer = document.getElementById(btn.dataset.target);
    if (!answer) return;
    btn.addEventListener('click', () => {
      const isOpen = answer.classList.contains('open');
      answer.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });

  // Garance icons — draw themselves in one after another (cena -> termín -> záruka)
  const garanceDrawIcons = document.querySelectorAll('.garance-draw-icon');
  garanceDrawIcons.forEach(icon => {
    icon.querySelectorAll('path, circle').forEach(shape => {
      const len = shape.getTotalLength ? shape.getTotalLength() : 40;
      shape.style.strokeDasharray = len;
      shape.style.strokeDashoffset = len;
    });
  });
  const garanceIconsWrap = document.querySelector('.garance-icons');
  if (garanceIconsWrap && window.IntersectionObserver) {
    const garanceIconObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.garance-item').forEach((item, itemIndex) => {
          const shapes = item.querySelectorAll('.garance-draw-icon path, .garance-draw-icon circle');
          shapes.forEach((shape, shapeIndex) => {
            shape.style.transitionDelay = (itemIndex * 0.55 + shapeIndex * 0.15) + 's';
            shape.style.strokeDashoffset = '0';
          });
        });
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    garanceIconObserver.observe(garanceIconsWrap);
  } else {
    garanceDrawIcons.forEach(icon => icon.querySelectorAll('path, circle').forEach(shape => { shape.style.strokeDashoffset = '0'; }));
  }

  // Garance icons — tooltip stays inside the viewport instead of clipping off-screen
  function positionGaranceTooltip(item) {
    const tooltip = item.querySelector('.garance-tooltip');
    const arrow = item.querySelector('.garance-tooltip-arrow');
    if (!tooltip) return;
    const margin = 14;
    tooltip.classList.remove('pos-above');
    tooltip.style.transform = 'translateX(-50%) translateY(0)';
    arrow.style.left = '50%';
    let rect = tooltip.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - margin) {
      tooltip.classList.add('pos-above');
      rect = tooltip.getBoundingClientRect();
    }
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin) shift = (window.innerWidth - margin) - rect.right;
    if (shift !== 0) {
      tooltip.style.transform = `translateX(calc(-50% + ${shift}px)) translateY(0)`;
      arrow.style.left = `calc(50% - ${shift}px)`;
    }
  }
  document.querySelectorAll('.garance-item').forEach(item => {
    item.addEventListener('mouseenter', () => positionGaranceTooltip(item));
    item.addEventListener('focus', () => positionGaranceTooltip(item));
    item.addEventListener('click', e => {
      const wasOpen = item.classList.contains('tooltip-open');
      document.querySelectorAll('.garance-item.tooltip-open').forEach(el => el.classList.remove('tooltip-open'));
      if (!wasOpen) { item.classList.add('tooltip-open'); positionGaranceTooltip(item); }
      e.stopPropagation();
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.garance-item.tooltip-open').forEach(el => el.classList.remove('tooltip-open'));
  });

  // Scroll-in reveal — text lands from the left, photos zoom in from small.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroRevealEls = document.querySelectorAll('.hero .reveal-left, .hero .reveal-zoom');
  const belowFoldRevealEls = Array.from(document.querySelectorAll('.reveal-left, .reveal-zoom')).filter(el => !el.closest('.hero'));
  if (reduceMotion) {
    heroRevealEls.forEach(el => el.classList.add('is-visible'));
    belowFoldRevealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    // Hero is already on screen at page load, so it gets its own load-triggered
    // animation (double rAF lets the browser paint the hidden state first —
    // an IntersectionObserver fires too instantly here to ever show a transition).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroRevealEls.forEach(el => el.classList.add('is-visible'));
      });
    });
    if (window.IntersectionObserver) {
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      belowFoldRevealEls.forEach(el => revealObserver.observe(el));
    } else {
      belowFoldRevealEls.forEach(el => el.classList.add('is-visible'));
    }
  }
});
