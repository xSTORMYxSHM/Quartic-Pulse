(() => {
  'use strict';

  function create(options = {}) {
    const catalog = options.catalog;
    const desktop = options.desktop;
    const canvas = options.canvas;
    const runtimeFactory = options.runtimeFactory;
    const picker = options.picker;
    const select = options.select;
    const packageSelect = options.packageSelect;
    const packageStatus = options.packageStatus;
    const customOptionsAnchor = options.customOptionsAnchor;
    const showToast = options.showToast || (() => {});
    const onCatalogChanged = options.onCatalogChanged || (() => {});
    const onPackagesChanged = options.onPackagesChanged || (() => {});
    if (!catalog || !desktop || !canvas || !runtimeFactory || !picker || !select) {
      throw new Error('Visualizer package controller dependencies are incomplete.');
    }

    let packages = [];
    let runtime = null;
    let activeStyleId = 0;
    let loadedStyleId = 0;
    let loadGeneration = 0;
    let loading = false;

    function packageFor(styleId) {
      return packages.find((item) => Number(item.styleId) === Number(styleId)) || null;
    }

    function isCustom(styleId) {
      return Boolean(packageFor(styleId));
    }

    function setStatus(message, tone = '') {
      if (!packageStatus) return;
      packageStatus.textContent = message;
      packageStatus.dataset.tone = tone;
    }

    function removeGeneratedUi() {
      picker.querySelectorAll('[data-custom-visual-style]').forEach((element) => element.remove());
      select.querySelectorAll('option[data-custom-visual-style]').forEach((element) => element.remove());
      document.querySelectorAll('[data-custom-visual-options]').forEach((element) => element.remove());
    }

    function createStyleCard(item) {
      const button = document.createElement('button');
      button.className = 'visual-style-card custom-visual-style-card';
      button.type = 'button';
      button.dataset.visualStyle = String(item.styleId);
      button.dataset.customVisualStyle = String(item.styleId);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      const preview = document.createElement('span');
      preview.className = 'visual-style-preview preview-custom-visualizer';
      preview.setAttribute('aria-hidden', 'true');
      if (item.previewDataUri) {
        const image = document.createElement('img');
        image.src = item.previewDataUri;
        image.alt = '';
        preview.appendChild(image);
      } else preview.textContent = 'DH';
      const copy = document.createElement('span');
      copy.className = 'visual-style-copy';
      const strong = document.createElement('strong');
      strong.textContent = item.name;
      const small = document.createElement('small');
      small.textContent = `Data Horizon package · ${item.version}`;
      copy.append(strong, small);
      button.append(preview, copy);
      return button;
    }

    function createOptionsPanel(item) {
      const panel = document.createElement('div');
      panel.className = 'visual-options visual-info-card custom-visualizer-options';
      panel.dataset.visualOptions = String(item.styleId);
      panel.dataset.customVisualOptions = String(item.styleId);
      panel.hidden = true;
      const strong = document.createElement('strong');
      strong.textContent = item.name.toUpperCase();
      const small = document.createElement('small');
      small.textContent = `Imported from Data Horizon · ${item.canvas.width}×${item.canvas.height} · ${item.audioContract} · deterministic offline frames enabled through SDR/8-bit export profiles.`;
      panel.append(strong, small);
      return panel;
    }

    function rebuildUi(nextPackages) {
      packages = Array.isArray(nextPackages) ? nextPackages : [];
      removeGeneratedUi();
      catalog.registerCustom(packages);
      for (const item of packages) {
        picker.appendChild(createStyleCard(item));
        const option = document.createElement('option');
        option.value = String(item.styleId);
        option.textContent = `Custom · ${item.name}`;
        option.dataset.customVisualStyle = String(item.styleId);
        select.appendChild(option);
        const panel = createOptionsPanel(item);
        customOptionsAnchor?.parentElement?.insertBefore(panel, customOptionsAnchor);
      }
      if (packageSelect) {
        packageSelect.replaceChildren();
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = packages.length ? 'Choose installed package' : 'No custom visualizers installed';
        packageSelect.appendChild(empty);
        for (const item of packages) {
          const option = document.createElement('option');
          option.value = String(item.styleId);
          option.textContent = `${item.name} · ${item.version}`;
          packageSelect.appendChild(option);
        }
      }
      catalog.decorate();
      setStatus(packages.length
        ? `${packages.length} custom visualizer${packages.length === 1 ? '' : 's'} installed`
        : 'Import a folder exported for Quartic Pulse by Data Horizon.');
      onCatalogChanged(Object.freeze([...packages]));
      onPackagesChanged(Object.freeze([...packages]));
      return packages;
    }

    async function refresh() {
      return rebuildUi(await desktop.listVisualizerPackages());
    }

    async function initialize() {
      try { await refresh(); }
      catch (error) {
        setStatus(`Package registry unavailable: ${error.message}`, 'error');
        showToast(`Custom visualizers: ${error.message}`, true);
      }
      return Object.freeze([...packages]);
    }

    async function importPackage() {
      setStatus('Validating Data Horizon package…');
      let imported;
      if (desktop.previewVisualizerPackage && desktop.installVisualizerPackage) {
        const previewResult = await desktop.previewVisualizerPackage();
        if (!previewResult) return setStatus(packages.length ? `${packages.length} custom visualizer${packages.length === 1 ? '' : 's'} installed` : 'Import cancelled.');
        const item = previewResult.package;
        const paletteSummary = item.paletteCount
          ? `${item.paletteCount} named palette${item.paletteCount === 1 ? '' : 's'}`
          : 'no bundled palettes';
        const updateSummary = item.updating ? `Update installed version ${item.installedVersion} to ${item.version}` : `Install version ${item.version}`;
        const sizeMb = (Number(item.bytes || 0) / 1048576).toFixed(1);
        const confirmed = window.confirm(`${updateSummary} of “${item.name}” by ${item.createdBy}?\n\n${item.files} files · ${sizeMb} MB · ${paletteSummary}\n\nQuartic Pulse imports project data and palettes only; package JavaScript is not executed.`);
        if (!confirmed) return setStatus('Package preview cancelled.');
        setStatus(item.updating ? `Updating ${item.name}…` : `Installing ${item.name}…`);
        imported = await desktop.installVisualizerPackage(previewResult.token);
      } else imported = await desktop.importVisualizerPackage();
      if (!imported) return setStatus('Import cancelled.');
      await refresh();
      packageSelect.value = String(imported.styleId);
      select.value = String(imported.styleId);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      showToast(`${imported.name} installed from Data Horizon${imported.paletteCount ? ` with ${imported.paletteCount} palette${imported.paletteCount === 1 ? '' : 's'}` : ''}`);
      return imported;
    }

    async function removeSelected() {
      const styleId = Number(packageSelect?.value);
      const item = packageFor(styleId);
      if (!item) return false;
      const paletteNote = item.paletteCount ? ` Its ${item.paletteCount} package palette${item.paletteCount === 1 ? '' : 's'} will also be removed.` : '';
      if (!window.confirm(`Remove the installed visualizer “${item.name}”?${paletteNote} The original Data Horizon export will not be changed.`)) return false;
      if (activeStyleId === styleId) {
        select.value = '0';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      await desktop.removeVisualizerPackage(styleId);
      await refresh();
      showToast(`${item.name} removed from Quartic Pulse`);
      return true;
    }

    async function activate(styleId) {
      const requested = Number(styleId);
      activeStyleId = requested;
      const generation = ++loadGeneration;
      if (!isCustom(requested)) {
        loading = false;
        return false;
      }
      if (loadedStyleId === requested && runtime?.ready) return true;
      loading = true;
      setStatus(`Loading ${packageFor(requested).name}…`);
      try {
        const payload = await desktop.loadVisualizerPackage(requested);
        if (generation !== loadGeneration || activeStyleId !== requested) return false;
        if (!runtime) runtime = runtimeFactory.create({ canvas });
        const loaded = await runtime.setPackage(payload);
        if (generation !== loadGeneration || activeStyleId !== requested) return false;
        loadedStyleId = loaded ? requested : 0;
        loading = false;
        setStatus(loaded ? `${payload.package.name} ready` : `Could not load ${payload.package.name}`, loaded ? '' : 'error');
        return loaded;
      } catch (error) {
        if (generation === loadGeneration) {
          loading = false;
          loadedStyleId = 0;
          setStatus(`Load failed: ${error.message}`, 'error');
          showToast(`Custom visualizer: ${error.message}`, true);
        }
        return false;
      }
    }

    function clear() {
      const gl = runtime?.gl || canvas.getContext('webgl2');
      if (!gl) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.BLEND);
      gl.clearColor(.006, .012, .025, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function render(frame) {
      if (!isCustom(activeStyleId) || loadedStyleId !== activeStyleId || !runtime?.ready) {
        clear();
        return null;
      }
      return runtime.render(frame);
    }

    options.importButton?.addEventListener('click', () => importPackage().catch((error) => {
      setStatus(`Import failed: ${error.message}`, 'error');
      showToast(`Import failed: ${error.message}`, true);
    }));
    options.removeButton?.addEventListener('click', () => removeSelected().catch((error) => showToast(error.message, true)));
    packageSelect?.addEventListener('change', () => {
      if (options.removeButton) options.removeButton.disabled = !packageSelect.value;
    });

    return Object.freeze({
      activate,
      finish: () => runtime?.finish(),
      initialize,
      isCustom,
      get loading() { return loading; },
      get packages() { return Object.freeze([...packages]); },
      refresh,
      render
    });
  }

  window.QuarticVisualizerPackageController = Object.freeze({ create });
})();
