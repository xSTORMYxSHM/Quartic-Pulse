(() => {
  'use strict';

  const builtInColors = Object.freeze([
    Object.freeze([[.035, .067, .145], [.125, .275, .430], [.390, .335, .555], [.420, .660, .710]]),
    Object.freeze([[.075, .043, .055], [.300, .130, .145], [.610, .315, .220], [.790, .585, .345]]),
    Object.freeze([[.025, .090, .100], [.070, .280, .285], [.250, .465, .380], [.555, .680, .500]]),
    Object.freeze([[.030, .040, .060], [.145, .175, .215], [.350, .390, .435], [.680, .705, .730]])
  ]);

  function normalizedColors(profile) {
    if (profile?.kind !== 'colors') return null;
    const palette = Math.round(Number(profile?.data?.palette));
    if (palette >= 0 && palette < builtInColors.length) return builtInColors[palette].map((color) => [...color]);
    if (!Array.isArray(profile?.data?.customColors) || profile.data.customColors.length !== 4) return null;
    const colors = profile.data.customColors.map((color) => {
      if (!Array.isArray(color) || color.length !== 3) return null;
      const channels = color.map(Number);
      if (channels.some((value) => !Number.isFinite(value))) return null;
      return channels.map((value) => Math.max(0, Math.min(1, value)));
    });
    return colors.every(Boolean) ? colors : null;
  }

  function channelHex(value) {
    return Math.round(value * 255).toString(16).padStart(2, '0');
  }

  function colorHex(color) {
    return `#${color.map(channelHex).join('')}`;
  }

  function create(options = {}) {
    const container = options.container;
    const section = options.section || container;
    const documentRef = options.documentRef || document;
    const getProfiles = options.getProfiles || (() => []);
    const onApply = options.onApply || (() => {});
    if (!container) throw new Error('Palette library container is required.');
    let activeProfileId = '';
    let bound = false;

    function profiles() {
      return (Array.isArray(getProfiles()) ? getProfiles() : [])
        .filter((profile) => normalizedColors(profile))
        .sort((first, second) => Number(Boolean(second.favorite)) - Number(Boolean(first.favorite))
          || String(second.updatedAt || '').localeCompare(String(first.updatedAt || '')));
    }

    function markActive(profileId = '') {
      activeProfileId = String(profileId || '');
      for (const button of container.querySelectorAll('[data-saved-palette-id]')) {
        const active = button.dataset.savedPaletteId === activeProfileId;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      }
    }

    function render() {
      const available = profiles();
      container.replaceChildren();
      section.hidden = available.length === 0;
      for (const profile of available) {
        const colors = normalizedColors(profile);
        const button = documentRef.createElement('button');
        button.className = 'palette saved-palette';
        button.type = 'button';
        button.dataset.palette = '4';
        button.dataset.savedPaletteId = profile.id;
        const packageName = String(profile.packagePalette?.packageName || '');
        if (packageName) button.dataset.packageId = String(profile.packagePalette.packageId || '');
        button.title = packageName
          ? `Apply ${profile.name} from ${packageName}`
          : `Apply color palette: ${profile.name}`;
        button.setAttribute('aria-label', packageName
          ? `Apply package color palette ${profile.name} from ${packageName}`
          : `Apply saved color palette ${profile.name}`);
        button.setAttribute('aria-pressed', 'false');
        const swatch = documentRef.createElement('i');
        swatch.style.background = `linear-gradient(90deg, ${colors.map(colorHex).join(', ')})`;
        const label = documentRef.createElement('span');
        label.textContent = `${profile.favorite ? '★ ' : ''}${profile.name}${packageName ? ` · ${packageName}` : ''}`;
        button.append(swatch, label);
        container.appendChild(button);
      }
      markActive(available.some((profile) => profile.id === activeProfileId) ? activeProfileId : '');
      return available;
    }

    function bind() {
      if (bound) return;
      bound = true;
      container.addEventListener('click', (event) => {
        const button = event.target.closest?.('[data-saved-palette-id]');
        if (!button) return;
        const profile = profiles().find((item) => item.id === button.dataset.savedPaletteId);
        if (!profile) return;
        onApply(profile);
        markActive(profile.id);
      });
    }

    function initialize() {
      bind();
      return render();
    }

    return Object.freeze({
      clearActive: () => markActive(''),
      initialize,
      markActive,
      render,
      get activeProfileId() { return activeProfileId; },
      get diagnostics() { return Object.freeze({ ready: true, bound, paletteCount: profiles().length }); }
    });
  }

  window.QuarticPaletteLibraryController = Object.freeze({ create, normalizedColors });
})();
