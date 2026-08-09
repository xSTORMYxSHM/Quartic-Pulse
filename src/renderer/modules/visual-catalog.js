(() => {
  'use strict';

  const styles = Object.freeze([
    Object.freeze({ id: 0, key: 'fractal', name: 'Fractal', category: 'FRACTAL', description: 'Mandelbrot and equation-driven forms' }),
    Object.freeze({ id: 1, key: 'spectrum-bars', name: 'Spectrum Bars', category: 'CONVENTIONAL', description: 'Classic frequency columns' }),
    Object.freeze({ id: 2, key: 'radial-spectrum', name: 'Radial Spectrum', category: 'CONVENTIONAL', description: 'Audio wrapped around a ring' }),
    Object.freeze({ id: 3, key: 'pulse-rings', name: 'Pulse Rings', category: 'CONVENTIONAL', description: 'Beat-triggered expanding waves' }),
    Object.freeze({ id: 4, key: 'waveform-field', name: 'Waveform Field', category: 'CONVENTIONAL', description: 'Flowing oscilloscope lines' }),
    Object.freeze({ id: 5, key: 'mandelbulb', name: '3D Mandelbulb', category: '3D FRACTAL', description: 'True power-4 ray-marched fractal', formulaLabel: 'POWER-4 · 3D DE' }),
    Object.freeze({ id: 6, key: 'mainframe-room', name: 'Mainframe Room', category: 'SCENE', description: 'Reactive data chamber and storm reactor' })
  ]);

  const byId = new Map(styles.map((style) => [style.id, style]));

  function get(styleId) {
    return byId.get(Number(styleId)) || styles[0];
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
    return buttons.length === styles.length
      && select?.options.length === styles.length
      && buttons.every((button) => byId.has(Number(button.dataset.visualStyle)));
  }

  window.QuarticVisualCatalog = Object.freeze({ decorate, get, styles, validate });
})();
