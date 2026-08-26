(() => {
  'use strict';

  const builtInStyles = Object.freeze([
    Object.freeze({ id: 0, key: 'fractal', name: 'Fractal', category: 'FRACTAL', description: 'Mandelbrot and equation-driven forms' }),
    Object.freeze({ id: 1, key: 'spectrum-bars', name: 'Spectrum Bars', category: 'CONVENTIONAL', description: 'Classic frequency columns' }),
    Object.freeze({ id: 2, key: 'radial-spectrum', name: 'Radial Spectrum', category: 'CONVENTIONAL', description: 'Audio wrapped around a ring' }),
    Object.freeze({ id: 3, key: 'pulse-rings', name: 'Pulse Rings', category: 'CONVENTIONAL', description: 'Beat-triggered expanding waves' }),
    Object.freeze({ id: 4, key: 'waveform-field', name: 'Waveform Field', category: 'CONVENTIONAL', description: 'Flowing oscilloscope lines' }),
    Object.freeze({ id: 5, key: 'mandelbulb', name: '3D Mandelbulb', category: '3D FRACTAL', description: 'True power-4 ray-marched fractal', formulaLabel: 'POWER-4 · 3D DE' }),
    Object.freeze({ id: 6, key: 'data-horizon', name: 'Data Horizon', category: 'SCENE', description: 'Neon terrain with streaming signals' })
  ]);
  const customStyles = [];
  const byId = new Map(builtInStyles.map((style) => [style.id, style]));

  function styles() {
    return Object.freeze([...builtInStyles, ...customStyles]);
  }

  function registerCustom(packages = []) {
    for (const style of customStyles) byId.delete(style.id);
    customStyles.splice(0);
    for (const item of packages) {
      const id = Number(item?.styleId);
      if (!Number.isSafeInteger(id) || id < 1000 || byId.has(id)) continue;
      const style = Object.freeze({
        id,
        key: String(item.key || `custom-${id}`).slice(0, 100),
        name: String(item.name || 'Custom Visualizer').slice(0, 80),
        category: String(item.category || 'CUSTOM').slice(0, 30).toUpperCase(),
        description: String(item.description || 'Imported Data Horizon visualizer').slice(0, 180),
        custom: true,
        packageId: String(item.packageId || '').slice(0, 180),
        previewDataUri: String(item.previewDataUri || ''),
        version: String(item.version || '').slice(0, 40)
      });
      customStyles.push(style);
      byId.set(id, style);
    }
    return styles();
  }

  function get(styleId) {
    return byId.get(Number(styleId)) || builtInStyles[0];
  }

  function decorate(root = document) {
    root.querySelectorAll('#visualStylePicker [data-visual-style]').forEach((button) => {
      const style = get(button.dataset.visualStyle);
      button.dataset.visualKey = style.key;
      button.dataset.visualCategory = style.category;
      button.setAttribute('aria-label', `${style.name}: ${style.description}`);
    });
  }

  function validate(root = document) {
    const buttons = [...root.querySelectorAll('#visualStylePicker [data-visual-style]')];
    const select = root.querySelector('#visualStyle');
    const available = styles();
    return buttons.length === available.length
      && select?.options.length === available.length
      && buttons.every((button) => byId.has(Number(button.dataset.visualStyle)));
  }

  window.QuarticVisualCatalog = Object.freeze({
    decorate,
    get,
    get styles() { return styles(); },
    isCustom: (styleId) => Boolean(byId.get(Number(styleId))?.custom),
    registerCustom,
    validate
  });
})();
