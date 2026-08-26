(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      workspaceShell,
      state,
      visualCatalog,
      getVisualizerPackageController = () => null,
      isObsOutput = false,
      updateExportHdrAvailability = () => {},
      fractalPresets,
      audioModulationController,
      coordinateExportSettingsChange = () => {},
      showToast = () => {},
      visualPresetController,
      effectPresets,
      paletteLibraryController
    } = options;
    if (!$ || !workspaceShell || !state || !visualCatalog || !fractalPresets || !visualPresetController) {
      throw new Error('Workspace UI controller requires shell, state, visual catalog, presets, and UI dependencies.');
    }

    function activateTab(tabName) {
      workspaceShell.activate(tabName, state.interfaceMode);
    }

    function updateVisualStyleOptions() {
      if (!visualCatalog.styles.some((style) => style.id === Number(state.visualStyle))) {
        state.visualStyle = 0;
        $('#visualStyle').value = '0';
        document.body.dataset.visualStyle = '0';
      }
      const activeStyle = visualCatalog.get(state.visualStyle);
      getVisualizerPackageController()?.activate(state.visualStyle);
      if (!isObsOutput) updateExportHdrAvailability();
      document.querySelectorAll('#visualStylePicker [data-visual-style]').forEach((button) => {
        const active = Number(button.dataset.visualStyle) === state.visualStyle;
        button.classList.toggle('active', active);
        button.setAttribute('aria-checked', String(active));
      });
      document.querySelectorAll('[data-visual-options]').forEach((panel) => {
        panel.hidden = Number(panel.dataset.visualOptions) !== state.visualStyle;
      });
      const conventional = state.visualStyle !== 0;
      $('#fractalType').disabled = conventional;
      $('#fractalEquationControl').classList.toggle('control-disabled', conventional);
      const preset = fractalPresets[state.fractalType] || fractalPresets[0];
      $('#formulaLabel').textContent = activeStyle.formulaLabel || (conventional ? activeStyle.name.toUpperCase() : preset.formula);
      if ($('#modulationRouteList')) audioModulationController.render();
    }

    const interfaceModeStorageKey = 'quarticPulseInterfaceModeV1';

    function setInterfaceMode(requestedMode, persist = true) {
      const mode = requestedMode === 'advanced' ? 'advanced' : 'basic';
      state.interfaceMode = mode;
      document.body.dataset.interfaceMode = mode;
      workspaceShell.syncInterfaceMode(mode);
      const basic = mode === 'basic';
      document.querySelectorAll('.advanced-ui-only, .advanced-ui-control').forEach((element) => {
        element.hidden = basic;
        if (basic && element.matches('details')) element.open = false;
      });
      if (basic && $('#videoFormat')?.value === 'av1_quality') {
        $('#videoFormat').value = 'gpu_auto';
        coordinateExportSettingsChange('format');
      }
      const activeTab = document.querySelector('.tab-panel.active')?.dataset.tabPanel || 'music';
      activateTab(workspaceShell.normalizeTab(activeTab, mode));
      if (persist) {
        try { localStorage.setItem(interfaceModeStorageKey, mode); } catch (_) { /* Storage is optional. */ }
      }
    }

    function initializeInterfaceMode() {
      let mode = 'basic';
      try { mode = localStorage.getItem(interfaceModeStorageKey) || mode; } catch (_) { /* Use Basic mode. */ }
      setInterfaceMode(mode, false);
      workspaceShell.bindInterfaceMode((nextMode) => {
        if (nextMode === state.interfaceMode) return;
        setInterfaceMode(nextMode);
        showToast(`${state.interfaceMode === 'advanced' ? 'Advanced' : 'Basic'} controls enabled`);
      });
    }


    const fractalFavoritesStorageKey = 'quarticPulseFractalFavoritesV1';
    let favoriteFractals = [];

    function fractalOptionName(value) {
      return [...$('#fractalType').options].find((option) => option.value === String(value))?.textContent || `Equation ${value}`;
    }

    function loadFractalFavorites() {
      try {
        const stored = JSON.parse(localStorage.getItem(fractalFavoritesStorageKey) || '[]');
        favoriteFractals = Array.isArray(stored) ? stored.map(String).filter((value) => [...$('#fractalType').options].some((option) => option.value === value)) : [];
      } catch (_) { favoriteFractals = []; }
    }

    function renderFractalLibrary() {
      const selected = $('#fractalType').value;
      const query = $('#fractalSearch').value.trim().toLowerCase();
      const matches = [...$('#fractalType').options].filter((option) => !query || option.textContent.toLowerCase().includes(query));
      for (const option of $('#fractalType').options) option.hidden = Boolean(query) && !matches.includes(option);
      const favoriteButton = $('#favoriteFractalButton');
      const isFavorite = favoriteFractals.includes(selected);
      favoriteButton.classList.toggle('active', isFavorite);
      favoriteButton.setAttribute('aria-pressed', String(isFavorite));
      favoriteButton.textContent = `${isFavorite ? '\u2605' : '\u2606'} FAVORITE`;
      const container = $('#fractalFavoriteButtons');
      container.replaceChildren();
      const choices = query ? matches.map((option) => option.value) : favoriteFractals;
      for (const value of choices) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.fractalValue = value;
        button.textContent = fractalOptionName(value);
        container.appendChild(button);
      }
      const section = $('#fractalFavorites');
      section.hidden = choices.length === 0;
      section.querySelector(':scope > span').textContent = query ? `SEARCH RESULTS · ${choices.length}` : 'FAVORITES';
    }

    function initializeFractalLibrary() {
      loadFractalFavorites();
      renderFractalLibrary();
      $('#fractalSearch').addEventListener('input', renderFractalLibrary);
      $('#favoriteFractalButton').addEventListener('click', () => {
        const value = $('#fractalType').value;
        favoriteFractals = favoriteFractals.includes(value)
          ? favoriteFractals.filter((item) => item !== value)
          : [...favoriteFractals, value];
        localStorage.setItem(fractalFavoritesStorageKey, JSON.stringify(favoriteFractals));
        renderFractalLibrary();
      });
      $('#fractalFavoriteButtons').addEventListener('click', (event) => {
        const value = event.target.closest('[data-fractal-value]')?.dataset.fractalValue;
        if (!value) return;
        $('#fractalType').value = value;
        $('#fractalType').dispatchEvent(new Event('change', { bubbles: true }));
        renderFractalLibrary();
      });
    }

    function resetActiveVisual() {
      if (visualCatalog.isCustom(state.visualStyle)) {
        showToast(`${visualCatalog.get(state.visualStyle).name} uses its authored Data Horizon settings`);
        return;
      }
      if (state.visualStyle === 0) {
        resetFractalView();
        visualPresetController.applyControlDefaults({
          ...effectPresets.fractal.dimensional.values,
          ...effectPresets.fold.soft.values,
          coreCStrength: .5,
          coreBiasReal: 0,
          coreBiasImag: 0
        });
        for (const id of ['fractalDimensional', 'equationFolding']) {
          const control = $(`#${id}`);
          control.checked = false;
          control.dispatchEvent(new Event('change', { bubbles: true }));
        }
        document.querySelectorAll('[data-effect-group="fractal"] .visual-preset').forEach((button) => {
          button.classList.toggle('active', button.dataset.effectPreset === 'dimensional');
        });
        document.querySelectorAll('[data-effect-group="fold"] .visual-preset').forEach((button) => {
          button.classList.toggle('active', button.dataset.effectPreset === 'soft');
        });
        showToast('Fractal view and equation effects reset');
        return;
      }
      if (state.visualStyle === 1) return visualPresetController.applyEffect('spectrum', 'balanced');
      if (state.visualStyle === 2) return visualPresetController.applyEffect('radial', 'balanced');
      if (state.visualStyle === 3) return visualPresetController.applyPulse('balanced');
      if (state.visualStyle === 5) {
        state.bulbYaw = .38;
        state.bulbPitch = .12;
        visualPresetController.applyEffect('bulb', 'quartic');
        showToast('3D Mandelbulb view reset');
        return;
      }
      visualPresetController.applyControlDefaults({ flow: .28, motion: .85, reactivity: .9 });
      showToast(state.visualStyle === 6
        ? 'Data Horizon quick controls reset'
        : 'Waveform Field quick controls reset');
    }

    function updateZoomControls() {
      const zoomSlider = $('#zoom');
      const sliderValue = Math.max(Number(zoomSlider.min), Math.min(Number(zoomSlider.max), (Math.log10(state.zoom) + .4) * 25));
      zoomSlider.value = sliderValue;
      $('#zoomValue').value = `${state.zoom < 10 ? state.zoom.toFixed(2) : state.zoom.toFixed(0)}×`;
      zoomSlider._syncNumericValue?.();
    }

    function resetFractalView() {
      const preset = fractalPresets[state.fractalType] || fractalPresets[0];
      state.center.x = preset.center[0];
      state.center.y = preset.center[1];
      state.zoom = preset.zoom;
      state.modulationRotationPhase = 0;
      updateZoomControls();
    }

    function panelWidthLimits() {
      const minimum = 300;
      const ultrawide = window.innerWidth >= 2560;
      const preferredMaximum = ultrawide
        ? Math.min(900, Math.round(window.innerWidth * .24))
        : 520;
      return {
        minimum,
        maximum: Math.max(minimum, Math.min(preferredMaximum, window.innerWidth - 440)),
        maximumScale: ultrawide ? 1.65 : 1.25
      };
    }

    function setPanelWidth(requestedWidth, persist = true) {
      const { minimum, maximum, maximumScale } = panelWidthLimits();
      const width = Math.round(Math.max(minimum, Math.min(maximum, requestedWidth)));
      const scale = Math.max(.86, Math.min(maximumScale, width / 360));
      document.documentElement.style.setProperty('--panel-width', `${width}px`);
      document.documentElement.style.setProperty('--panel-scale', scale.toFixed(3));
      document.documentElement.style.setProperty('--panel-layout-width', `${(width / scale).toFixed(2)}px`);
      document.documentElement.style.setProperty('--panel-layout-height', `${(window.innerHeight / scale).toFixed(2)}px`);
      $('#panelResizer').setAttribute('aria-valuemin', String(minimum));
      $('#panelResizer').setAttribute('aria-valuemax', String(maximum));
      $('#panelResizer').setAttribute('aria-valuenow', String(width));
      if (persist) {
        try { localStorage.setItem('quarticPanelWidth', String(width)); } catch (_) { /* Storage is optional. */ }
      }
      return width;
    }

    function initializePanelResizer() {
      const resizer = $('#panelResizer');
      let width = 360;
      try { width = Number(localStorage.getItem('quarticPanelWidth')) || width; } catch (_) { /* Use the default. */ }
      setPanelWidth(width, false);

      const endResize = (event) => {
        if (!document.body.classList.contains('resizing-panel')) return;
        document.body.classList.remove('resizing-panel');
        if (event?.pointerId !== undefined && resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
      };

      resizer.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        resizer.setPointerCapture(event.pointerId);
        document.body.classList.add('resizing-panel');
        setPanelWidth(window.innerWidth - event.clientX);
      });
      resizer.addEventListener('pointermove', (event) => {
        if (document.body.classList.contains('resizing-panel')) setPanelWidth(window.innerWidth - event.clientX);
      });
      resizer.addEventListener('pointerup', endResize);
      resizer.addEventListener('pointercancel', endResize);
      resizer.addEventListener('dblclick', () => setPanelWidth(360));
      resizer.addEventListener('keydown', (event) => {
        const current = Number(resizer.getAttribute('aria-valuenow')) || 360;
        let next = current;
        if (event.key === 'ArrowLeft') next += 20;
        else if (event.key === 'ArrowRight') next -= 20;
        else if (event.key === 'Home') next = 300;
        else if (event.key === 'End') next = panelWidthLimits().maximum;
        else return;
        event.preventDefault();
        setPanelWidth(next);
      });
      window.addEventListener('resize', () => setPanelWidth(Number(resizer.getAttribute('aria-valuenow')) || 360, false));
    }

    function clampByte(value) {
      return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
    }

    function rgbToHex(rgb) {
      return `#${rgb.map((value) => clampByte(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    }

    function hexToRgb(value) {
      const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
      if (!match) return null;
      return [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16));
    }

    function setCustomColor(index, rgb) {
      const safe = rgb.map(clampByte);
      const hex = rgbToHex(safe);
      state.customColors[index] = safe.map((value) => value / 255);
      $(`#customColor${index}`).value = hex.toLowerCase();
      $(`#customHex${index}`).value = hex;
      ['R', 'G', 'B'].forEach((channel, channelIndex) => {
        $(`#custom${channel}${index}`).value = safe[channelIndex];
      });
      const swatch = $('.custom-palette');
      swatch.style.setProperty(`--custom-${index}`, hex);
      paletteLibraryController?.clearActive();
    }

    function bindCustomPalette() {
      for (let index = 0; index < 4; index++) {
        $(`#customColor${index}`).addEventListener('input', (event) => {
          const rgb = hexToRgb(event.target.value);
          if (rgb) setCustomColor(index, rgb);
        });
        $(`#customHex${index}`).addEventListener('change', (event) => {
          const rgb = hexToRgb(event.target.value);
          if (rgb) setCustomColor(index, rgb);
          else event.target.value = rgbToHex(state.customColors[index].map((value) => value * 255));
        });
        ['R', 'G', 'B'].forEach((channel) => {
          $(`#custom${channel}${index}`).addEventListener('input', () => {
            setCustomColor(index, ['R', 'G', 'B'].map((name) => $(`#custom${name}${index}`).value));
          });
        });
        setCustomColor(index, state.customColors[index].map((value) => value * 255));
      }
      $('#resetCustomPaletteButton').addEventListener('click', () => {
        const defaults = [[9, 17, 37], [32, 70, 110], [99, 85, 142], [107, 168, 181]];
        defaults.forEach((rgb, index) => setCustomColor(index, rgb));
        showToast('Custom palette reset to default colors');
      });
    }


    return Object.freeze({
      activateTab,
      updateVisualStyleOptions,
      setInterfaceMode,
      initializeInterfaceMode,
      renderFractalLibrary,
      initializeFractalLibrary,
      resetActiveVisual,
      updateZoomControls,
      resetFractalView,
      setPanelWidth,
      initializePanelResizer,
      setCustomColor,
      bindCustomPalette,
      get diagnostics() { return Object.freeze({ ready: true, favorites: favoriteFractals.length, interfaceMode: state.interfaceMode }); }
    });
  }

  window.QuarticWorkspaceUiController = Object.freeze({ create });
})();
