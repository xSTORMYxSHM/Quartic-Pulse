(() => {
  'use strict';

  function create(options = {}) {
    const {
      query: $,
      documentRef = document,
      windowRef = window,
      storage = localStorage,
      desktop,
      state,
      dataEngine,
      profileManagerController,
      paletteLibraryController,
      audioModulationController,
      visualCatalog,
      getVisualizerPackages = () => [],
      setCustomColor,
      clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
      showToast = () => {}
    } = options;
    if (!$ || !desktop || !state || !dataEngine || !profileManagerController || !paletteLibraryController || !audioModulationController) {
      throw new Error('Profile service requires UI, state, data, profile, palette, and modulation dependencies.');
    }

    const storageKey = 'quarticPulseSavedProfilesV1';
    const application = 'quartic-pulse-profile';
    const schemaVersion = 1;
    const colorControlIds = ['frequencyColor', 'frequencyColorAmount', 'analysisSmoothing'];
    const fullControlIds = [
      ...colorControlIds,
      'frequencyBandMode', 'frequencyFloor', 'lowMidSplit', 'midHighSplit', 'frequencyCeiling', 'beatSensitivity', 'beatCooldown',
      'visualStyle', 'fractalType', 'fractalDimensional', 'equationFolding',
      'coreCStrength', 'coreBiasReal', 'coreBiasImag',
      'fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth',
      'equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio',
      'barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid', 'barStyle',
      'radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere',
      'pulseDensity', 'pulseSize', 'pulseCooldown', 'pulseJagged', 'pulseTrail', 'pulseDetail',
      'bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera',
      'zoom', 'flow', 'autoReactivity', 'reactivity', 'motion', 'spin', 'equationSmoothing', 'equationMod',
      'adaptiveQuality', 'beatPulse', 'autoDrift',
      'iterations', 'resolution', 'exportIterations', 'fps', 'videoFormat', 'exportDetail', 'exportMatchLive', 'exportSupersampling', 'exportSamplingMode', 'exportHdrOutput', 'showExportPreview', 'exportCompleteSound',
      'obsResolution', 'obsFps', 'obsAlwaysOnTop', 'obsChromaKey', 'obsChromaThreshold',
      'musicPersonality', 'songDirectorStyle', 'songDirectorBehavior', 'songDirectorTransition', 'songDirectorIntensity'
    ];
    let profiles = [];
    let initialized = false;
    let packageRecords = [];
    let pendingPackageRecords = null;

    function captureControls(ids) {
      const controls = {};
      for (const id of ids) {
        const control = $(`#${id}`);
        if (!control) continue;
        controls[id] = control.type === 'checkbox' ? Boolean(control.checked) : String(control.value);
      }
      return controls;
    }

    function captureColors() {
      return {
        palette: state.palette,
        customColors: state.customColors.map((color) => color.map((value) => Number(value.toFixed(6)))),
        controls: captureControls(colorControlIds)
      };
    }

    function capture(kind) {
      const colors = captureColors();
      if (kind === 'colors') return colors;
      const activePackage = getVisualizerPackages().find((item) => Number(item.styleId) === Number(state.visualStyle));
      return {
        ...colors,
        controls: captureControls(fullControlIds),
        visualizerPackage: activePackage ? { id: activePackage.packageId, name: activePackage.name, version: activePackage.version } : null,
        center: { x: state.center.x, y: state.center.y },
        bulbView: { yaw: state.bulbYaw, pitch: state.bulbPitch },
        modulation: {
          enabled: state.modulationEnabled,
          mappings: state.modulationMappings.map(audioModulationController.serializeMapping)
        }
      };
    }

    function isValid(profile) {
      return dataEngine.isValidProfile(profile);
    }

    function load() {
      profiles = dataEngine.parseProfiles(storage.getItem(storageKey) || '[]');
      return profiles;
    }

    function replace(nextProfiles) {
      profiles = Array.isArray(nextProfiles) ? nextProfiles : [];
      if (initialized) rebuildPackagePalettes(packageRecords, { renderNow: false });
      return profiles;
    }

    function paletteColors(colors) {
      return colors.map((color) => [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255));
    }

    function rebuildPackagePalettes(nextPackages, { renderNow = true } = {}) {
      packageRecords = Array.isArray(nextPackages) ? nextPackages : [];
      const existingManaged = new Map(profiles
        .filter((profile) => profile.packagePalette?.managed)
        .map((profile) => [profile.id, profile]));
      const userProfiles = profiles.filter((profile) => !profile.packagePalette?.managed);
      const available = Math.max(0, 100 - userProfiles.length);
      const managed = [];
      const now = new Date().toISOString();
      for (const item of packageRecords) {
        for (const palette of Array.isArray(item.palettes) ? item.palettes : []) {
          if (managed.length >= available) break;
          const id = `package-palette:${item.packageId}:${palette.id}`;
          const existing = existingManaged.get(id);
          managed.push({
            id,
            name: palette.name,
            kind: 'colors',
            favorite: existing ? Boolean(existing.favorite) : Boolean(palette.favorite),
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            packagePalette: {
              managed: true,
              packageId: item.packageId,
              packageName: item.name,
              packageVersion: item.version,
              paletteId: palette.id
            },
            data: { palette: 4, customColors: paletteColors(palette.colors), controls: {} }
          });
        }
      }
      profiles = [...userProfiles, ...managed];
      persist();
      if (renderNow) render();
      const requested = packageRecords.reduce((count, item) => count + (Array.isArray(item.palettes) ? item.palettes.length : 0), 0);
      if (requested > managed.length) showToast(`${requested - managed.length} package palette${requested - managed.length === 1 ? '' : 's'} could not be added because the 100-profile library is full.`, true);
      return managed;
    }

    function syncPackagePalettes(nextPackages) {
      if (!initialized) {
        pendingPackageRecords = Array.isArray(nextPackages) ? nextPackages : [];
        return [];
      }
      return rebuildPackagePalettes(nextPackages);
    }

    function persist() {
      storage.setItem(storageKey, dataEngine.serializeProfiles(profiles));
    }

    function setStatus(message) {
      profileManagerController.setStatus(message);
    }

    function selected() {
      return profileManagerController.selectedProfile();
    }

    function render(preferredId = '') {
      const profile = profileManagerController.render(preferredId);
      paletteLibraryController.render();
      return profile;
    }

    function applyControls(values, allowedIds) {
      if (!values || typeof values !== 'object') return;
      for (const id of allowedIds) {
        if (!Object.hasOwn(values, id)) continue;
        const control = $(`#${id}`);
        if (!control) continue;
        if (control.type === 'checkbox') {
          if (typeof values[id] !== 'boolean') continue;
          control.checked = values[id];
        } else if (control.type === 'range' || control.type === 'number') {
          const numericValue = Number(values[id]);
          if (!Number.isFinite(numericValue)) continue;
          control.value = String(clamp(numericValue, Number(control.min), Number(control.max)));
        } else if (control.tagName === 'SELECT') {
          const requestedValue = String(values[id]);
          if (![...control.options].some((option) => option.value === requestedValue)) continue;
          control.value = requestedValue;
        } else control.value = String(values[id]);
        const eventName = control.type === 'range' ? 'input' : 'change';
        control.dispatchEvent(new windowRef.Event(eventName, { bubbles: true }));
        control._syncNumericValue?.();
      }
    }

    function applyColors(data) {
      if (Array.isArray(data.customColors) && data.customColors.length === 4) {
        data.customColors.forEach((color, index) => {
          if (Array.isArray(color) && color.length === 3 && color.every((value) => Number.isFinite(Number(value)))) {
            setCustomColor(index, color.map((value) => clamp(Number(value), 0, 1) * 255));
          }
        });
      }
      const palette = Math.max(0, Math.min(4, Math.round(Number(data.palette) || 0)));
      documentRef.querySelector(`.palette[data-palette="${palette}"]`)?.click();
      applyControls(data.controls, colorControlIds);
    }

    function apply(profile, { quiet = false } = {}) {
      if (!isValid(profile)) throw new Error('This profile is not valid.');
      applyColors(profile.data);
      let missingVisualizer = '';
      if (profile.kind === 'settings') {
        let controls = profile.data.controls;
        const packageReference = profile.data.visualizerPackage;
        if (packageReference?.id) {
          const installedPackage = getVisualizerPackages().find((item) => item.packageId === packageReference.id);
          controls = { ...controls };
          if (installedPackage) controls.visualStyle = String(installedPackage.styleId);
          else {
            delete controls.visualStyle;
            missingVisualizer = packageReference.name || packageReference.id;
          }
        }
        applyControls(controls, fullControlIds);
        if (profile.data.modulation && typeof profile.data.modulation === 'object') audioModulationController.replace(profile.data.modulation);
        if (profile.data.center && Number.isFinite(Number(profile.data.center.x)) && Number.isFinite(Number(profile.data.center.y))) {
          state.center.x = clamp(Number(profile.data.center.x), -1000000, 1000000);
          state.center.y = clamp(Number(profile.data.center.y), -1000000, 1000000);
        }
        if (profile.data.bulbView && Number.isFinite(Number(profile.data.bulbView.yaw)) && Number.isFinite(Number(profile.data.bulbView.pitch))) {
          state.bulbYaw = Number(profile.data.bulbView.yaw);
          state.bulbPitch = clamp(Number(profile.data.bulbView.pitch), -1.2, 1.2);
        }
      }
      if (profile.kind === 'colors') paletteLibraryController.markActive(profile.id); else paletteLibraryController.clearActive();
      if (!quiet) {
        showToast(`${profile.name} profile applied`);
        setStatus(missingVisualizer
          ? `Settings applied, but install the Data Horizon package “${missingVisualizer}” to restore its custom visualizer.`
          : `${profile.kind === 'colors' ? 'Color Palette' : 'Full Visual Settings'} applied successfully.`);
        if (missingVisualizer) showToast(`Missing custom visualizer package: ${missingVisualizer}`, true);
      }
    }

    function save(options = {}) {
      const name = String(options.name || $('#profileName').value).trim().slice(0, 60);
      if (!name) return showToast('Enter a profile name first.', true);
      const kind = options.kind === 'colors' || (!options.kind && $('#profileKind').value === 'colors') ? 'colors' : 'settings';
      const now = new Date().toISOString();
      const existing = profiles.find((profile) => profile.kind === kind && profile.name.toLowerCase() === name.toLowerCase());
      const profile = {
        id: existing?.id || (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
        name,
        kind,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        data: capture(kind)
      };
      if (existing) profiles.splice(profiles.indexOf(existing), 1, profile); else profiles.unshift(profile);
      profiles = profiles.slice(0, 100);
      persist();
      render(profile.id);
      if (!options.keepForm) $('#profileName').value = '';
      if (kind === 'colors') paletteLibraryController.markActive(profile.id);
      showToast(`${name} ${existing ? 'updated' : 'saved'} locally`);
      return profile;
    }

    function quickSavePalette() {
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
      return save({ name: `Custom Palette · ${stamp}`, kind: 'colors', keepForm: true });
    }

    function quickSaveVisual() {
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19).replaceAll(':', '-');
      $('#profileName').value = `${visualCatalog.get(state.visualStyle).name} · ${stamp}`.slice(0, 60);
      $('#profileKind').value = 'settings';
      return save();
    }

    async function exportProfile(profile = selected()) {
      if (!profile) return;
      const documentData = { application, schemaVersion, exportedAt: new Date().toISOString(), profile: { ...profile } };
      const outputPath = await desktop.exportProfile(profile.name, JSON.stringify(documentData, null, 2));
      if (outputPath) {
        showToast(`Profile exported: ${outputPath}`);
        setStatus(`Exported ${profile.name} as a shareable JSON profile.`);
      }
    }

    async function importFile(file) {
      if (!file) return;
      if (file.size > 1024 * 1024) throw new Error('Profile files must be smaller than 1 MB.');
      const parsed = JSON.parse(await file.text());
      if (parsed?.application !== application || Number(parsed?.schemaVersion) !== schemaVersion) {
        throw new Error('This is not a compatible Quartic Pulse profile file.');
      }
      const imported = parsed.profile;
      if (!isValid(imported)) throw new Error('The imported profile is incomplete or damaged.');
      let name = imported.name.trim().slice(0, 60) || 'Imported Profile';
      if (profiles.some((profile) => profile.kind === imported.kind && profile.name.toLowerCase() === name.toLowerCase())) name = `${name.slice(0, 49)} (Imported)`;
      const now = new Date().toISOString();
      const profile = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, name, kind: imported.kind, createdAt: now, updatedAt: now, data: imported.data };
      profiles.unshift(profile);
      profiles = profiles.slice(0, 100);
      persist();
      render(profile.id);
      if (profile.kind === 'colors') paletteLibraryController.markActive(profile.id);
      showToast(`${name} imported`);
    }

    function favorite(profile) {
      if (!profile) return;
      profile.favorite = !profile.favorite;
      profile.updatedAt = new Date().toISOString();
      persist();
      render(profile.id);
    }

    function remove(profile) {
      if (!profile) return;
      if (profile.packagePalette?.managed) {
        showToast(`“${profile.name}” belongs to ${profile.packagePalette.packageName}. Remove or update that Data Horizon package instead.`, true);
        return;
      }
      if (!windowRef.confirm(`Delete the saved profile "${profile.name}"?`)) return;
      profiles = profiles.filter((item) => item.id !== profile.id);
      persist();
      render();
      showToast(`${profile.name} deleted`);
    }

    function initialize() {
      if (initialized) return;
      initialized = true;
      load();
      if (pendingPackageRecords) {
        rebuildPackagePalettes(pendingPackageRecords, { renderNow: false });
        pendingPackageRecords = null;
      }
      paletteLibraryController.initialize();
      profileManagerController.initialize();
    }

    return Object.freeze({
      initialize,
      capture,
      isValid,
      load,
      replace,
      persist,
      selected,
      render,
      applyControls,
      applyFullControls: (values) => applyControls(values, fullControlIds),
      applyColors,
      apply,
      save,
      quickSavePalette,
      quickSaveVisual,
      syncPackagePalettes,
      exportProfile,
      importFile,
      favorite,
      remove,
      get profiles() { return profiles; },
      get diagnostics() { return Object.freeze({ ready: true, initialized, count: profiles.length }); }
    });
  }

  window.QuarticProfileServiceController = Object.freeze({ create });
})();
