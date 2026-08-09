(() => {
  'use strict';

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const styles = Object.freeze({
    subtle: Object.freeze({ label: 'Subtle', master: .48, camera: .62, equation: .48, color: .6, depth: .42, fold: .34 }),
    cinematic: Object.freeze({ label: 'Cinematic', master: 1, camera: 1.12, equation: .82, color: .95, depth: 1.08, fold: .72 }),
    mathematical: Object.freeze({ label: 'Mathematical', master: .94, camera: .65, equation: 1.35, color: .88, depth: .92, fold: 1.24 }),
    storm: Object.freeze({ label: 'Storm', master: 1.22, camera: 1.12, equation: 1.16, color: 1.2, depth: 1.16, fold: 1.08 })
  });

  const behaviors = Object.freeze({
    balanced: Object.freeze({ label: 'Balanced', camera: 1, equation: 1, color: 1, motion: 1, depth: 1, fold: 1, pulse: 1, rotation: 1, bass: 1, mids: 1, highs: 1, transition: .18 }),
    electronic: Object.freeze({ label: 'Electronic / EDM', camera: 1.08, equation: 1.08, color: 1.25, motion: 1.25, depth: 1.05, fold: 1.05, pulse: 1.35, rotation: 1.12, bass: 1.25, mids: .95, highs: 1.2, transition: .11 }),
    hiphop: Object.freeze({ label: 'Hip-Hop', camera: 1.2, equation: 1.1, color: .9, motion: .85, depth: .8, fold: .9, pulse: 1.05, rotation: .65, bass: 1.45, mids: 1, highs: .75, transition: .22 }),
    rock: Object.freeze({ label: 'Rock / Metal', camera: 1, equation: 1.15, color: 1, motion: 1.2, depth: 1, fold: 1.18, pulse: 1.3, rotation: 1.05, bass: 1.05, mids: 1.3, highs: 1.18, transition: .13 }),
    pop: Object.freeze({ label: 'Pop', camera: .95, equation: .9, color: 1.35, motion: 1.05, depth: .95, fold: .8, pulse: 1.1, rotation: .9, bass: .95, mids: 1.15, highs: 1.25, transition: .16 }),
    ambient: Object.freeze({ label: 'Ambient / Classical', camera: .72, equation: .58, color: .82, motion: .62, depth: 1.35, fold: .68, pulse: .35, rotation: .42, bass: .7, mids: 1.12, highs: .95, transition: .34 })
  });

  const behaviorTargetScale = (key, behavior) => {
    if (['zoom', 'panX', 'panY'].includes(key)) return behavior.camera;
    if (key === 'rotationOffset') return behavior.rotation;
    if (key === 'motion') return behavior.motion;
    if (['equation', 'bulbPower'].includes(key)) return behavior.equation;
    if (['frequencyHue', 'flow', 'bulbGlow'].includes(key)) return behavior.color;
    if (['fractalTilt', 'fractalSlice'].includes(key)) return behavior.depth;
    if (['equationFold', 'equationWarp', 'bulbFold'].includes(key)) return behavior.fold;
    if (key === 'pulseJagged') return behavior.pulse;
    return 1;
  };

  const emphasisGroup = (key) => {
    if (['zoom', 'rotationOffset', 'panX', 'panY', 'motion'].includes(key)) return 'camera';
    if (['equation', 'bulbPower'].includes(key)) return 'equation';
    if (['frequencyHue', 'flow', 'bulbGlow', 'pulseJagged'].includes(key)) return 'color';
    if (['fractalTilt', 'fractalSlice'].includes(key)) return 'dimension';
    if (['equationFold', 'equationWarp', 'bulbFold'].includes(key)) return 'fold';
    return 'other';
  };

  const sectionArc = (kind) => ({ intro: .32, build: .76, peak: 1, breakdown: .24, bass: .76, lift: .72, outro: .18, steady: .56 })[kind] ?? .56;
  const smoothstep01 = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const styleTargetScale = (key, style) => {
    if (['zoom', 'rotationOffset', 'panX', 'panY', 'motion'].includes(key)) return style.camera;
    if (['equation', 'bulbPower'].includes(key)) return style.equation;
    if (['frequencyHue', 'flow', 'bulbGlow'].includes(key)) return style.color;
    if (['fractalTilt', 'fractalSlice'].includes(key)) return style.depth;
    if (['equationFold', 'equationWarp', 'bulbFold'].includes(key)) return style.fold;
    return 1;
  };

  function create({ hashText } = {}) {
    if (typeof hashText !== 'function') throw new Error('Song Director engine requires a hashText function.');

    const seedUnit = (text) => parseInt(hashText(String(text)), 16) / 0xffffffff;

    const resolveBehavior = (requestedBehavior, map) => {
      if (behaviors[requestedBehavior]) return requestedBehavior;
      return behaviors[map?.personality] ? map.personality : 'balanced';
    };

    const applyOverrideTargets = (cue, override) => {
      if (!override) return cue.targets;
      return Object.fromEntries(Object.entries(cue.targets).map(([key, value]) => {
        const emphasisScale = override.emphasis === 'auto'
          ? 1
          : (emphasisGroup(key) === override.emphasis ? 1.35 : .72);
        return [key, value * override.strength * emphasisScale];
      }));
    };

    const generatePlan = (map, requestedBehavior = 'auto') => {
      if (!map?.sections?.length) return [];
      const behaviorId = resolveBehavior(requestedBehavior, map);
      const behavior = behaviors[behaviorId];
      return map.sections.map((section, index) => {
        const randomA = seedUnit(`${map.key}|${index}|a`);
        const randomB = seedUnit(`${map.key}|${index}|b`);
        const direction = randomA < .5 ? -1 : 1;
        const arc = sectionArc(section.kind);
        const energy = clamp(Number(section.energy) || 0, 0, 1);
        const bass = clamp((Number(section.bass) || 0) * behavior.bass, 0, 1.35);
        const mids = clamp((Number(section.mids) || 0) * behavior.mids, 0, 1.35);
        const highs = clamp((Number(section.highs) || 0) * behavior.highs, 0, 1.35);
        const brightness = highs - bass;
        const sectionLength = Math.max(.1, (Number(section.end) || map.duration) - (Number(section.start) || 0));
        const sectionBeatCount = map.beats.filter((beat) => beat >= section.start && beat < section.end).length;
        const beatRate = clamp(sectionBeatCount / sectionLength / 2.5, 0, 1);
        const buildDirection = section.kind === 'build' ? 1 : (section.kind === 'outro' ? -1 : 0);
        return {
          index,
          start: Number(section.start) || 0,
          end: Number(section.end) || map.duration,
          label: section.label || `Movement ${index + 1}`,
          kind: section.kind || 'steady',
          energy,
          behaviorId,
          transitionFraction: behavior.transition,
          targets: Object.fromEntries(Object.entries({
            zoom: (arc - .46) * .14 + buildDirection * .025,
            rotationOffset: direction * (.018 + arc * .052 + randomB * .018),
            panX: direction * (.004 + randomB * .014) * (.45 + arc),
            panY: (randomA - .5) * .022 * (.5 + arc),
            equation: Math.max(0, .012 + energy * .105 + arc * .035),
            frequencyHue: brightness * .18 + direction * (.025 + randomB * .045),
            flow: .018 + arc * .085 + highs * .035,
            motion: .025 + arc * .16 + energy * .09 + beatRate * .035,
            fractalTilt: .015 + arc * .095 + mids * .035,
            fractalSlice: .01 + arc * .072 + highs * .03,
            equationFold: .004 + arc * .025 + mids * .012,
            equationWarp: .006 + arc * .038 + bass * .014,
            bulbPower: direction * (.04 + arc * .12),
            bulbFold: .004 + arc * .026,
            bulbGlow: .025 + arc * .14 + highs * .05,
            pulseJagged: .02 + arc * .13 + beatRate * .055
          }).map(([key, value]) => [key, value * behaviorTargetScale(key, behavior)]))
        };
      });
    };

    const evaluate = ({
      plan,
      map,
      time,
      styleId = 'cinematic',
      intensity = 1,
      getOverride = () => null,
      dimensionalEnabled = true,
      foldingEnabled = true
    } = {}) => {
      const requestedTime = Number(time) || 0;
      if (!map || !Array.isArray(plan) || !plan.length) return { values: {}, cue: null, songTime: requestedTime };
      const duration = map.duration || 1;
      const songTime = clamp(requestedTime, 0, duration);
      let index = plan.findIndex((cue) => songTime >= cue.start && songTime < cue.end);
      if (index < 0) index = plan.length - 1;
      const cue = plan[index];
      const previous = plan[Math.max(0, index - 1)];
      const sectionLength = Math.max(.1, cue.end - cue.start);
      const sectionProgress = clamp((songTime - cue.start) / sectionLength, 0, 1);
      const transition = Math.min(7, Math.max(.65, sectionLength * (cue.transitionFraction || .18)));
      const blend = index ? smoothstep01((songTime - cue.start) / transition) : 1;
      let arcEnvelope = 1;
      if (cue.kind === 'build') arcEnvelope = .56 + .44 * smoothstep01(sectionProgress);
      else if (cue.kind === 'outro') arcEnvelope = 1 - .68 * smoothstep01(sectionProgress);
      else if (cue.kind === 'intro') arcEnvelope = .55 + .45 * smoothstep01(sectionProgress);
      const style = styles[styleId] || styles.cinematic;
      const master = clamp(intensity, 0, 1) * style.master;
      const values = { cueIndex: index, cueLabel: cue.label, sectionProgress };
      const previousTargets = applyOverrideTargets(previous, getOverride(previous.index));
      const cueTargets = applyOverrideTargets(cue, getOverride(cue.index));
      for (const key of Object.keys(cueTargets)) {
        const from = previousTargets[key] || 0;
        const to = cueTargets[key] || 0;
        values[key] = (from + (to - from) * blend) * master * styleTargetScale(key, style) * arcEnvelope;
      }
      if (!dimensionalEnabled) {
        values.fractalTilt = 0;
        values.fractalSlice = 0;
      }
      if (!foldingEnabled) {
        values.equationFold = 0;
        values.equationWarp = 0;
      }
      return { values, cue, songTime };
    };

    return Object.freeze({
      styles,
      behaviors,
      resolveBehavior,
      applyOverrideTargets,
      generatePlan,
      evaluate,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticSongDirectorEngine = Object.freeze({ create });
})();
