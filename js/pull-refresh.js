/* NAGIMU — pull down from top to reload (onboarding only) */

function isOnboardingPage() {
  const path = window.location.pathname;
  return path === '/' || path.endsWith('/index.html');
}

if (isOnboardingPage()) {
  const THRESHOLD = 72;
  const MAX_PULL = 120;

  let startY = 0;
  let pulling = false;

  const indicator = document.createElement('div');
  indicator.className = 'pull-refresh';
  indicator.innerHTML = '<span class="pull-refresh__label">Pull to reload</span>';
  document.body.appendChild(indicator);

  const label = indicator.querySelector('.pull-refresh__label');

  function atTop() {
    return (window.scrollY || document.documentElement.scrollTop) <= 0;
  }

  function setPull(distance) {
    const clamped = Math.min(distance, MAX_PULL);
    const progress = Math.min(1, clamped / THRESHOLD);
    indicator.style.setProperty('--pull', `${clamped}px`);
    indicator.classList.toggle('pull-refresh--active', clamped > 8);
    label.textContent = progress >= 1 ? 'Release to reload' : 'Pull to reload';
  }

  function resetPull() {
    pulling = false;
    indicator.classList.remove('pull-refresh--ready');
    indicator.style.setProperty('--pull', '0px');
    setTimeout(() => indicator.classList.remove('pull-refresh--active'), 200);
  }

  document.addEventListener(
    'touchstart',
    (e) => {
      if (!atTop() || e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      pulling = true;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!pulling || !atTop()) return;

      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) {
        resetPull();
        return;
      }

      e.preventDefault();
      setPull(delta);
      indicator.classList.toggle('pull-refresh--ready', delta >= THRESHOLD);
    },
    { passive: false }
  );

  document.addEventListener(
    'touchend',
    () => {
      if (!pulling) return;
      const pull = parseFloat(indicator.style.getPropertyValue('--pull')) || 0;

      if (pull >= THRESHOLD) {
        label.textContent = 'Reloading…';
        indicator.classList.add('pull-refresh--loading');
        window.location.reload();
        return;
      }

      resetPull();
    },
    { passive: true }
  );

  document.addEventListener('touchcancel', resetPull, { passive: true });
}