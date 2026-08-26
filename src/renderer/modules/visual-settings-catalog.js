(() => {
  'use strict';

  const defaultFrequencyBands = Object.freeze({
    floor: 25,
    lowMid: 180,
    midHigh: 2400,
    ceiling: 12000
  });
  const musicPersonalityProfiles = Object.freeze({
    balanced: Object.freeze({
      label: 'Balanced', description: 'Natural response across most music', icon: [52, 66, 58],
      bands: defaultFrequencyBands, gains: [1, 1, 1], smoothing: .8, beatSensitivity: .65, beatCooldownMs: 150, autoTarget: .74
    }),
    electronic: Object.freeze({
      label: 'Electronic / EDM', description: 'Fast kicks, sub-bass, and bright transients', icon: [82, 48, 72],
      bands: Object.freeze({ floor: 28, lowMid: 160, midHigh: 2200, ceiling: 14000 }), gains: [1.12, .94, 1.05], smoothing: .72, beatSensitivity: .78, beatCooldownMs: 115, autoTarget: .76
    }),
    hiphop: Object.freeze({
      label: 'Hip-Hop', description: 'Weighty lows with steadier vocal space', icon: [88, 54, 38],
      bands: Object.freeze({ floor: 22, lowMid: 210, midHigh: 2600, ceiling: 12000 }), gains: [1.18, .92, .88], smoothing: .78, beatSensitivity: .72, beatCooldownMs: 145, autoTarget: .74
    }),
    rock: Object.freeze({
      label: 'Rock / Metal', description: 'Punch, guitars, cymbals, and quick attacks', icon: [52, 78, 84],
      bands: Object.freeze({ floor: 35, lowMid: 240, midHigh: 3200, ceiling: 15000 }), gains: [.95, 1.08, 1.1], smoothing: .66, beatSensitivity: .7, beatCooldownMs: 120, autoTarget: .72
    }),
    pop: Object.freeze({
      label: 'Pop', description: 'Clear vocals with polished full-range motion', icon: [58, 84, 66],
      bands: Object.freeze({ floor: 30, lowMid: 190, midHigh: 2800, ceiling: 15000 }), gains: [1, 1.08, 1.02], smoothing: .75, beatSensitivity: .68, beatCooldownMs: 135, autoTarget: .74
    }),
    ambient: Object.freeze({
      label: 'Ambient / Classical', description: 'Slow, detailed movement for wide dynamics', icon: [38, 62, 88],
      bands: Object.freeze({ floor: 25, lowMid: 150, midHigh: 1800, ceiling: 16000 }), gains: [.92, 1.06, 1.12], smoothing: .9, beatSensitivity: .52, beatCooldownMs: 190, autoTarget: .68
    })
  });

  const modulationSources = Object.freeze({
    bass: { label: 'Bass', stateKey: 'bass' },
    mids: { label: 'Mids', stateKey: 'mids' },
    highs: { label: 'Highs', stateKey: 'highs' },
    beat: { label: 'Beat', stateKey: 'beat' },
    rms: { label: 'Overall Level', stateKey: 'rms' }
  });
  const modulationTargets = Object.freeze({
    equation: { label: 'Equation Modulation', scale: .35, bipolar: true },
    equationFold: { label: 'Equation Fold', scale: .75 },
    equationWarp: { label: 'Equation Warp', scale: 1.0 },
    fractalTilt: { label: 'Dimensional Tilt', scale: .7 },
    fractalSlice: { label: 'Dimensional Slice', scale: .7 },
    zoom: { label: 'Camera Zoom', scale: .45, bipolar: true },
    rotation: { label: 'Rotation', scale: .8, bipolar: true },
    frequencyHue: { label: 'Color Position', scale: .55, bipolar: true },
    flow: { label: 'Color Flow', scale: .55, bipolar: true },
    motion: { label: 'Visual Motion', scale: 1.0 },
    pulseJagged: { label: 'Pulse Jaggedness', scale: .9 },
    bulbPower: { label: '3D Recurrence Warp', scale: 1.5, bipolar: true },
    bulbFold: { label: '3D Volumetric Fold', scale: .7 },
    bulbGlow: { label: '3D Surface Glow', scale: 1.0 }
  });

  const modulationPresets = Object.freeze({
    math: [
      { source: 'bass', target: 'equation', amount: 22, attack: 36, release: 22 },
      { source: 'mids', target: 'equationWarp', amount: 30, attack: 60, release: 28 },
      { source: 'highs', target: 'frequencyHue', amount: 35, attack: 86, release: 48 },
      { source: 'beat', target: 'zoom', amount: 48, attack: 100, release: 62 }
    ],
    dimension: [
      { source: 'bass', target: 'zoom', amount: 34, attack: 75, release: 25 },
      { source: 'mids', target: 'fractalTilt', amount: 38, attack: 55, release: 30 },
      { source: 'highs', target: 'fractalSlice', amount: 28, attack: 82, release: 45 },
      { source: 'beat', target: 'rotation', amount: 36, attack: 100, release: 58 }
    ],
    bulb: [
      { source: 'bass', target: 'bulbPower', amount: 42, attack: 74, release: 30 },
      { source: 'mids', target: 'bulbFold', amount: 34, attack: 58, release: 34 },
      { source: 'highs', target: 'bulbGlow', amount: 38, attack: 88, release: 48 },
      { source: 'beat', target: 'frequencyHue', amount: 28, attack: 100, release: 62 }
    ],
    conventional: [
      { source: 'bass', target: 'motion', amount: 38, attack: 72, release: 30 },
      { source: 'mids', target: 'frequencyHue', amount: 32, attack: 58, release: 36 },
      { source: 'highs', target: 'flow', amount: 30, attack: 88, release: 48 },
      { source: 'beat', target: 'pulseJagged', amount: 46, attack: 100, release: 62 }
    ]
  });

  const fractalEquationProfiles = Object.freeze({
    signature: { flow: .28, motion: .85, reactivity: .9, equationMod: .09, equationSmoothing: .9, iterations: 220 },
    smooth: { flow: .22, motion: .68, reactivity: .82, equationMod: .07, equationSmoothing: .92, iterations: 250 },
    detail: { flow: .18, motion: .58, reactivity: .76, equationMod: .055, equationSmoothing: .94, iterations: 280 },
    rational: { flow: .15, motion: .5, reactivity: .7, equationMod: .04, equationSmoothing: .95, iterations: 310 },
    roots: { flow: .16, motion: .46, reactivity: .68, equationMod: .035, equationSmoothing: .96, iterations: 290 }
  });

  const fractalPresets = [
    { name: 'Quartic Mandelbrot', formula: 'z⁴ + μz² + c', center: [-0.16, 0], zoom: 1, profile: 'signature', palette: 0 },
    { name: 'Classic Mandelbrot', formula: 'z² + μz + c', center: [-0.5, 0], zoom: 1, profile: 'smooth', palette: 2 },
    { name: 'Cubic Mandelbrot', formula: 'z³ + μz² + c', center: [0, 0], zoom: 1, profile: 'smooth', palette: 1 },
    { name: 'Burning Ship', formula: '(|Re z| + i|Im z|)² + c', center: [-0.5, -0.5], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Tricorn', formula: 'conj(z)² + c', center: [0, 0], zoom: 1, profile: 'smooth', palette: 2 },
    { name: 'Julia Set', formula: 'z² + k(t)', center: [0, 0], zoom: 1, profile: 'signature', palette: 0 },
    { name: 'Quintic Multibrot', formula: 'z⁵ + μz² + c', center: [0, 0], zoom: 1, profile: 'detail', palette: 0 },
    { name: 'Phoenix', formula: 'z² + c + pz₋₁', center: [0, 0], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Celtic', formula: '|Re(z²)| + iIm(z²) + c', center: [-0.25, 0], zoom: 1, profile: 'detail', palette: 2 },
    { name: 'Buffalo', formula: '|Re(z²)| + i|Im(z²)| + c', center: [-0.35, -0.1], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Perpendicular Burning Ship', formula: '(Re z − i|Im z|)² + c', center: [-0.45, -0.25], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Perpendicular Mandelbrot', formula: '(|Re z| − iIm z)² + c', center: [-0.45, 0], zoom: 1, profile: 'detail', palette: 2 },
    { name: 'Magnet I', formula: '((z²+c−1)/(2z+c−2))²', center: [0, 0], zoom: 1, profile: 'rational', palette: 3 },
    { name: 'Magnet II', formula: 'Magnet type-II rational map', center: [0, 0], zoom: 1, profile: 'rational', palette: 0 },
    { name: 'Lambda', formula: 'cz(1−z)', center: [0, 0], zoom: .8, profile: 'smooth', palette: 2 },
    { name: 'Man-o-War', formula: 'z² + z₋₁ + c', center: [-0.1, 0], zoom: 1, profile: 'detail', palette: 1 },
    { name: 'Spider', formula: 'z² + cₙ; cₙ₊₁=cₙ/2+z', center: [-0.1, 0], zoom: 1, profile: 'rational', palette: 0 },
    { name: 'Nova', formula: 'z − (z³−1)/(3z²) + c', center: [0, 0], zoom: 1, profile: 'roots', palette: 0 },
    { name: 'Newton', formula: 'z − (z³−1)/(3z²)', center: [0, 0], zoom: .75, profile: 'roots', palette: 2 },
    { name: 'Pickover Biomorph', formula: 'z³ + c · biomorph coloring', center: [0, 0], zoom: 1, profile: 'detail', palette: 1 }
  ];

  const effectPresets = Object.freeze({
    fractal: {
      dimensional: { label: 'Dimensional', values: { fractalTilt: .45, fractalDepthSpeed: .32, fractalPerspective: .45, fractalSlice: .25, fractalLighting: .55, fractalAudioDepth: .4 } },
      classic: { label: 'Classic', values: { fractalTilt: 0, fractalDepthSpeed: 0, fractalPerspective: 0, fractalSlice: 0, fractalLighting: 0, fractalAudioDepth: 0 } },
      deep: { label: 'Deep Orbit', values: { fractalTilt: .78, fractalDepthSpeed: .56, fractalPerspective: .82, fractalSlice: .48, fractalLighting: .9, fractalAudioDepth: .65 } },
      dream: { label: 'Dream Fold', values: { fractalTilt: .62, fractalDepthSpeed: -.3, fractalPerspective: 1.08, fractalSlice: .78, fractalLighting: .72, fractalAudioDepth: .82 } }
    },
    fold: {
      soft: { label: 'Soft Fold', values: { equationFold: .18, equationWarp: .12, equationFoldMotion: .16, equationFoldOffset: .1, equationWarpScale: .45, equationFoldAudio: .25 } },
      kaleidoscope: { label: 'Kaleidoscope', values: { equationFold: .52, equationWarp: .28, equationFoldMotion: .28, equationFoldOffset: .18, equationWarpScale: .65, equationFoldAudio: .4 } },
      liquid: { label: 'Liquid Equation', values: { equationFold: .12, equationWarp: .65, equationFoldMotion: .38, equationFoldOffset: .08, equationWarpScale: .9, equationFoldAudio: .65 } },
      mirror: { label: 'Static Mirror', values: { equationFold: .9, equationWarp: 0, equationFoldMotion: 0, equationFoldOffset: .18, equationWarpScale: 0, equationFoldAudio: 0 } }
    },
    spectrum: {
      balanced: { label: 'Mainframe City', values: { barStyle: 0, barWidth: 1, barGlow: 1.15, barReflection: .42, barMotion: .32, barEcho: .7, barGrid: .9 } },
      neon: { label: 'Data Core', values: { barStyle: 1, barWidth: .78, barGlow: 1.85, barReflection: .12, barMotion: .55, barEcho: 1.15, barGrid: .5 } },
      mirror: { label: 'Mirror Vault', values: { barStyle: 2, barWidth: .9, barGlow: 1.35, barReflection: 1, barMotion: .45, barEcho: .9, barGrid: 1.25 } },
      dance: { label: 'Packet Storm', values: { barStyle: 3, barWidth: .72, barGlow: 1.5, barReflection: .48, barMotion: 1.55, barEcho: 1.4, barGrid: .7 } }
    },
    radial: {
      balanced: { label: 'Balanced', values: { radialSize: 1, radialGlow: 1, radialWaves: 1, radialTwist: .3, radialSpokes: 1, radialAtmosphere: 1 } },
      halo: { label: 'Halo', values: { radialSize: 1.05, radialGlow: 1.75, radialWaves: .45, radialTwist: .15, radialSpokes: .55, radialAtmosphere: 1.35 } },
      starburst: { label: 'Starburst', values: { radialSize: .9, radialGlow: 1.15, radialWaves: .75, radialTwist: .55, radialSpokes: 1.85, radialAtmosphere: .6 } },
      orbit: { label: 'Orbit Echo', values: { radialSize: 1.1, radialGlow: .9, radialWaves: 1.65, radialTwist: 1.3, radialSpokes: .8, radialAtmosphere: .85 } }
    },
    bulb: {
      quartic: { label: 'Quartic Core', values: { bulbPower: 4, bulbDetail: .55, bulbAudio: .65, bulbOrbit: .28, bulbFold: 0, bulbGlow: 1.2, bulbCamera: 3.75 } },
      deep: { label: 'Deep Orbit', values: { bulbPower: 4, bulbDetail: .84, bulbAudio: .48, bulbOrbit: .16, bulbFold: .08, bulbGlow: 1.45, bulbCamera: 3.25 } },
      storm: { label: 'Storm Fold', values: { bulbPower: 4, bulbDetail: .7, bulbAudio: 1, bulbOrbit: .42, bulbFold: .72, bulbGlow: 1.5, bulbCamera: 3.85 } },
      neon: { label: 'Neon Shell', values: { bulbPower: 6, bulbDetail: .45, bulbAudio: .78, bulbOrbit: -.35, bulbFold: .28, bulbGlow: 2, bulbCamera: 4.1 } }
    }
  });

  const effectControlGroups = Object.freeze({
    fractal: ['fractalTilt', 'fractalDepthSpeed', 'fractalPerspective', 'fractalSlice', 'fractalLighting', 'fractalAudioDepth'],
    fold: ['equationFold', 'equationWarp', 'equationFoldMotion', 'equationFoldOffset', 'equationWarpScale', 'equationFoldAudio'],
    spectrum: ['barWidth', 'barGlow', 'barReflection', 'barMotion', 'barEcho', 'barGrid'],
    radial: ['radialSize', 'radialGlow', 'radialWaves', 'radialTwist', 'radialSpokes', 'radialAtmosphere'],
    bulb: ['bulbPower', 'bulbDetail', 'bulbAudio', 'bulbOrbit', 'bulbFold', 'bulbGlow', 'bulbCamera']
  });

  const pulsePresets = Object.freeze({
    balanced: { label: 'Balanced', values: { pulseDensity: .75, pulseSize: 1, pulseCooldown: 1, pulseJagged: 1, pulseTrail: 1, pulseDetail: 1.25 } },
    condensed: { label: 'Condensed', values: { pulseDensity: .45, pulseSize: .82, pulseCooldown: 1.25, pulseJagged: .8, pulseTrail: .75, pulseDetail: 1.65 } },
    wide: { label: 'Wide Echoes', values: { pulseDensity: .90, pulseSize: 1.45, pulseCooldown: 1.15, pulseJagged: .9, pulseTrail: 1.1, pulseDetail: 1.4 } },
    rapid: { label: 'Rapid', values: { pulseDensity: .96, pulseSize: .95, pulseCooldown: .55, pulseJagged: 1.15, pulseTrail: .75, pulseDetail: 1.1 } }
  });

  const experiencePresets = Object.freeze({
    lowFlash: { label: 'Low Flash', values: { flow: .12, reactivity: .55, motion: .42, equationSmoothing: .97, equationMod: .025, frequencyColorAmount: .2, analysisSmoothing: .92, beatSensitivity: .5, bulbAudio: .16, pulseDensity: .4, pulseCooldown: 1.8 }, checks: { autoReactivity: false, beatPulse: false, fractalDimensional: false, equationFolding: false } },
    balanced: { label: 'Balanced', values: { flow: .28, reactivity: .9, motion: .85, equationSmoothing: .9, equationMod: .09, frequencyColorAmount: .55, analysisSmoothing: .8, beatSensitivity: .65, bulbAudio: .4, pulseDensity: .65, pulseCooldown: 1.25 }, checks: { autoReactivity: true, beatPulse: true, fractalDimensional: false, equationFolding: false } },
    expressive: { label: 'Expressive', values: { flow: .45, reactivity: 1.35, motion: 1.4, equationSmoothing: .78, equationMod: .18, frequencyColorAmount: .95, analysisSmoothing: .68, beatSensitivity: .78, bulbAudio: .72, pulseDensity: .82, pulseCooldown: .85 }, checks: { autoReactivity: true, beatPulse: true, fractalDimensional: false, equationFolding: false } }
  });

  const numericSliderConfigs = {
    volume: { defaultRange: .82, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls speaker volume only. Exported audio remains at full level.' },
    frequencyColorAmount: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls frequency-driven palette movement from 0 to 100 percent.' },
    analysisSmoothing: { defaultRange: .8, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Higher percentages create steadier color and meter movement; lower percentages react faster.' },
    songDirectorIntensity: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Scales the Director cue layer without changing the underlying visual preset. Lower values keep section changes restrained.' },
    songDirectorCueStrength: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Reduces this section from its automatically generated cue strength. One hundred percent preserves the full generated cue; zero makes the section visually still.' },
    frequencyFloor: { defaultRange: 25, min: 20, max: 500, step: 5, decimals: 0, tip: 'Lowest frequency included in the low band. Frequencies below this value are ignored by the visualizer.' },
    lowMidSplit: { defaultRange: 180, min: 80, max: 1200, step: 10, decimals: 0, tip: 'Boundary between the low and mid bands. Moving it higher lets more upper-bass energy drive low-frequency effects.' },
    midHighSplit: { defaultRange: 2400, min: 400, max: 8000, step: 50, decimals: 0, tip: 'Boundary between the mid and high bands. Moving it higher keeps more presence frequencies in the mid band.' },
    frequencyCeiling: { defaultRange: 12000, min: 4000, max: 20000, step: 100, decimals: 0, tip: 'Highest frequency included in the high band. Frequencies above this value are ignored by the visualizer.' },
    zoom: { defaultRange: 10, min: .4, max: 12000, step: .01, decimals: 2, fromRange: (value) => Math.pow(10, value / 25 - .4), toRange: (value) => (Math.log10(value) + .4) * 25, tip: 'Magnification of the current fractal view. The slider uses a logarithmic scale.' },
    flow: { defaultRange: .28, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Sets palette movement from 0 to 100 percent.' },
    reactivity: { defaultRange: .9, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 3 * 100, toRange: (value) => value / 100 * 3, tip: 'Master music response from 0 to 100 percent.' },
    motion: { defaultRange: .85, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2.5 * 100, toRange: (value) => value / 100 * 2.5, tip: 'Scales camera drift, breathing, interior waves, and rotational motion from 0 to 100 percent.' },
    coreCStrength: { defaultRange: .5, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Changes the influence of c in the selected recurrence. Fifty percent preserves the original equation; lower and higher values reshape its core.' },
    coreBiasReal: { defaultRange: 0, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Offsets the real component of the recurrence constant. Zero preserves the selected equation.' },
    coreBiasImag: { defaultRange: 0, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Offsets the imaginary component of the recurrence constant. Zero preserves the selected equation.' },
    fractalTilt: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Tilts the fractal sampling plane through virtual depth. Higher values create a stronger dimensional turn.' },
    fractalDepthSpeed: { defaultRange: .32, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Sets dimensional rotation speed and direction from -50 to +50 percent.' },
    fractalPerspective: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Controls near/far perspective from 0 to 100 percent.' },
    fractalSlice: { defaultRange: .25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Moves the complex sampling coordinates along the virtual depth direction, producing a folded slice effect.' },
    fractalLighting: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Adds depth-based shading and highlights from 0 to 100 percent.' },
    fractalAudioDepth: { defaultRange: .4, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Lets bass, mids, and beats increase tilt and slice movement without changing the selected equation.' },
    equationFold: { defaultRange: .18, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Folds the complex value across a moving axis during every equation iteration. The response is curved so low and middle values remain usable instead of immediately overwhelming the fractal.' },
    equationWarp: { defaultRange: .12, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Applies a bounded nonlinear complex warp using a gradual response curve. Higher values increasingly bend the folded structure.' },
    equationFoldMotion: { defaultRange: .16, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Rotates the equation fold axis from -50 to +50 percent. Negative values reverse direction.' },
    equationFoldOffset: { defaultRange: .1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Moves the mirrored fold away from the equation origin, creating asymmetry and separated lobes.' },
    equationWarpScale: { defaultRange: .45, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Scales nonlinear bending from 0 to 100 percent.' },
    equationFoldAudio: { defaultRange: .25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Adds the smoothed bass, mid, and beat envelope to fold and warp depth. It now creates motion even at low base fold values without multiplying the recurrence into a solid field.' },
    barWidth: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) * 100, toRange: (value) => .5 + value / 100, tip: 'Changes spectrum column width from 0 to 100 percent.' },
    barGlow: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds spectrum glow from 0 to 100 percent.' },
    barReflection: { defaultRange: .35, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Reflects a shortened version of the spectrum downward from the top edge.' },
    barMotion: { defaultRange: .35, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Bends spectrum columns from 0 to 100 percent.' },
    barEcho: { defaultRange: .6, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds animated peak echoes from 0 to 100 percent.' },
    barGrid: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls the scan-line grid from 0 to 100 percent.' },
    radialSize: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) / 1.1 * 100, toRange: (value) => .5 + value / 100 * 1.1, tip: 'Scales the radial spectrum from 0 to 100 percent.' },
    radialGlow: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Adds a radial halo from 0 to 100 percent.' },
    radialWaves: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls radial echo waves from 0 to 100 percent.' },
    radialTwist: { defaultRange: .3, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Warps the circular mapping from 0 to 100 percent.' },
    radialSpokes: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls radial teeth from 0 to 100 percent.' },
    radialAtmosphere: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls the radial atmosphere from 0 to 100 percent.' },
    pulseDensity: { defaultRange: .75, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls the pulse emission budget. Higher percentages accept weaker transients, shorten the shared delay, and allow a few more active rings. Even at 100%, simultaneous frequency hits are combined into one ring.' },
    pulseSize: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .5) / 1.5 * 100, toRange: (value) => .5 + value / 100 * 1.5, tip: 'Scales the Pulse Rings composition from 0 to 100 percent.' },
    pulseCooldown: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - .25) / 2.75 * 100, toRange: (value) => .25 + value / 100 * 2.75, tip: 'Sets pulse creation delay from 0 to 100 percent.' },
    pulseJagged: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring jaggedness from 0 to 100 percent.' },
    pulseTrail: { defaultRange: 1, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring trails from 0 to 100 percent.' },
    pulseDetail: { defaultRange: 1.25, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls Pulse Ring contour detail from 0 to 100 percent.' },
    bulbPower: { defaultRange: 4, min: 2, max: 10, step: 1, decimals: 0, tip: 'The whole-number exponent used by the 3D Mandelbulb recurrence. Integer powers keep the spherical angle wrap seamless; Power 4 is the Quartic Pulse signature shape.' },
    bulbDetail: { defaultRange: .55, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls recurrence depth and ray-marching precision. Adaptive quality can still reduce live render resolution.' },
    bulbAudio: { defaultRange: .65, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Lets bass, mids, highs, and beats reshape the 3D recurrence, camera, and surface light.' },
    bulbOrbit: { defaultRange: .28, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Automatically orbits the camera. Negative values reverse direction; zero leaves manual camera orientation still.' },
    bulbFold: { defaultRange: 0, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Folds the 3D recurrence during each iteration to create mirrored hybrid structures. Zero preserves the pure Mandelbulb equation.' },
    bulbGlow: { defaultRange: 1.2, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 2 * 100, toRange: (value) => value / 100 * 2, tip: 'Controls edge light, specular highlights, and the near-surface atmospheric aura.' },
    bulbCamera: { defaultRange: 3.75, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => (value - 2.25) / 3 * 100, toRange: (value) => 2.25 + value / 100 * 3, tip: 'Moves the 3D camera toward or away from the Mandelbulb. The mouse wheel adjusts the same value.' },
    spin: { defaultRange: .18, min: -50, max: 50, step: 1, decimals: 0, fromRange: (value) => value * 50, toRange: (value) => value / 50, tip: 'Rotates from -50 to +50 percent. Negative values reverse direction.' },
    equationSmoothing: { defaultRange: .9, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Dampens rapid music changes before they reach topology-changing fractal math. Higher values produce calmer, flowing deformation.' },
    equationMod: { defaultRange: .09, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / 1.5 * 100, toRange: (value) => value / 100 * 1.5, tip: 'Controls the strength of the smoothed music signal applied directly to the active fractal equation.' },
    beatSensitivity: { defaultRange: .65, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value * 100, toRange: (value) => value / 100, tip: 'Controls the independent adaptive onset detector. Higher values recognize quieter and less bass-heavy beats without changing visual or equation smoothing.' },
    beatCooldown: { defaultRange: 150, min: 80, max: 300, step: 5, decimals: 0, tip: 'Minimum time between detected beats. Raise it if a single drum hit triggers twice; lower it for very fast music.' },
    iterations: { defaultRange: 220, min: 80, max: 500, step: 10, decimals: 0, tip: 'Higher iteration counts reveal finer boundaries but require more GPU work.' },
    exportIterations: { defaultRange: 600, min: 240, max: 1200, step: 20, decimals: 0, tip: 'Alternate-look mathematical depth for offline export. It applies only when Match Live Mathematics is off; higher values change the fractal set rather than simply sharpening it.' },
    obsChromaThreshold: { defaultRange: .08, min: 0, max: 100, step: 1, decimals: 0, fromRange: (value) => value / .5 * 100, toRange: (value) => value / 100 * .5, tip: 'Higher values replace more dark pixels with pure key green. Chroma-safe mode automatically shifts green subject colors away from the OBS key.' }
    ,beatBpm: { defaultRange: 120, min: 60, max: 200, step: .1, decimals: 1, tip: 'Manual tempo used when Automatic BPM is off or has not found a reliable beat.' }
    ,beatOffset: { defaultRange: 0, min: -500, max: 500, step: 5, decimals: 0, tip: 'Moves the beat grid earlier or later in milliseconds so visual changes land on the music.' }
  };

  const selectSettingConfigs = {
    playbackRate: { defaultValue: '1', tip: 'Changes live playback and export speed while preserving pitch when supported.' },
    frequencyBandMode: { defaultValue: 'basic', tip: 'Basic uses the recommended frequency bands. Advanced enables custom continuous boundaries for low, mid, and high analysis.' },
    visualStyle: { defaultValue: '0', tip: 'Chooses the GPU-rendered visual composition. Every style uses the active palette and music analysis and is included in video exports.' },
    fractalType: { defaultValue: '0', tip: 'Selects the equation used for the live view and exported video.' },
    resolution: { defaultValue: '1920x1080', tip: 'Sets exported frame size and loads a visible recommended iteration starting point. You can adjust the iteration value afterward.' },
    fps: { defaultValue: '60', tip: 'Sets captured frames per second. 90 and 120 FPS require a fast GPU and storage.' },
    videoFormat: { defaultValue: 'gpu_auto', tip: 'Automatic GPU Master chooses hardware AV1 when supported or hardware HEVC Main 10 on GPUs such as the RTX 3080. Manual HEVC, H.264, VP9, AV1, editing, and lossless profiles remain available.' },
    exportMode: { defaultValue: 'offline', tip: 'Offline rendering completes and submits every exact frame before advancing the music timeline.' },
    exportDetail: { defaultValue: '1.6', tip: 'Multiplies the selected base detail. Offline export also applies a resolution-aware minimum so 1440p and 4K receive enough mathematical definition.' },
    obsResolution: { defaultValue: '1920x1080', tip: 'Sets the exact client size of the clean window selected by OBS Window Capture.' },
    obsFps: { defaultValue: '60', tip: 'Sets how often the control window sends visual and music-analysis state to the OBS output.' }
    ,songDirectorBehavior: { defaultValue: 'auto', tip: 'Auto follows the Music Personality stored with the Song Map. An override changes directing behavior without changing analyzer bands or the visual preset.' }
    ,songDirectorTransition: { defaultValue: 'auto', tip: 'Controls how sections blend. Every option remains continuous: Gentle uses longer blends, while Theatrical concentrates the change without creating a hard cut.' }
    ,songDirectorCueEmphasis: { defaultValue: 'auto', tip: 'Focuses this section on one family of visual controls while retaining a smaller amount of the other automatically generated cues.' }
    ,showAdvanceMode: { defaultValue: 'beats', tip: 'Advance each show entry after musical beats or elapsed seconds.' }
    ,showTransition: { defaultValue: 'black', tip: 'Cut immediately or briefly fade through black without layering conventional and fractal visuals.' }
    ,cameraPathEasing: { defaultValue: 'smooth', tip: 'Smooth is balanced, Linear keeps constant speed, and Cinematic eases very gently at both ends.' }
    ,quickClipDuration: { defaultValue: '10', tip: 'Sets the length of a fast live-canvas clip. Use Export for full-song and maximum-detail rendering.' }
    ,nowPlayingPosition: { defaultValue: 'bottom-left', tip: 'Places the live now-playing card without changing the fractal canvas.' }
    ,performanceMode: { defaultValue: 'auto', tip: 'Automatic uses detected hardware plus the optional eight-second benchmark. Manual modes remain available.' }
  };

  const checkboxSettingDefaults = {
    loopPlayback: false,
    frequencyColor: true,
    songDirectorEnabled: false,
    autoReactivity: true,
    adaptiveQuality: true,
    beatPulse: true,
    autoDrift: true,
    fractalDimensional: false,
    equationFolding: false,
    exportMatchLive: true,
    exportSamplingMode: 'standard',
    exportSupersampling: false,
    exportHdrOutput: false,
    showExportPreview: false,
    exportCompleteSound: true,
    obsAlwaysOnTop: false,
    obsChromaKey: false,
    modulationEnabled: true,
    autoBpm: true,
    showLoop: true,
    showShuffle: false,
    obsFollowScenes: true,
    oscAllowLan: false,
    cameraPathLoop: false,
    nowPlayingEnabled: false,
    performanceProtection: true,
    unleashedMode: false
  };

  window.QuarticVisualSettingsCatalog = Object.freeze({
    defaultFrequencyBands,
    musicPersonalityProfiles,
    modulationSources,
    modulationTargets,
    modulationPresets,
    fractalEquationProfiles,
    fractalPresets,
    effectPresets,
    effectControlGroups,
    pulsePresets,
    experiencePresets,
    numericSliderConfigs,
    selectSettingConfigs,
    checkboxSettingDefaults
  });
})();
