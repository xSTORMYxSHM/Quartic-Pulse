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

  const transitions = Object.freeze({
    auto: Object.freeze({ label: 'Auto', fraction: null, minimum: .65, maximum: 7, curve: 'smooth' }),
    gentle: Object.freeze({ label: 'Gentle', fraction: .34, minimum: 1.6, maximum: 10, curve: 'gentle' }),
    balanced: Object.freeze({ label: 'Balanced', fraction: .2, minimum: .9, maximum: 7, curve: 'smooth' }),
    theatrical: Object.freeze({ label: 'Theatrical', fraction: .1, minimum: .55, maximum: 4.5, curve: 'theatrical' })
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
  const smootherstep01 = (value) => {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  const transitionCurve = (value, curve) => {
    if (curve === 'gentle') return smootherstep01(value);
    if (curve === 'theatrical') return smoothstep01(clamp((value - .08) / .84, 0, 1));
    return smoothstep01(value);
  };

  const sampleSongSeries = (map, key, time, windowSeconds = 0) => {
    const series = map?.[key];
    const interval = Number(map?.interval);
    if (!Array.isArray(series) || !series.length || !Number.isFinite(interval) || interval <= 0) return null;
    const center = clamp((Number(time) || 0) / interval, 0, series.length - 1);
    const radius = Math.max(0, windowSeconds / interval);
    const first = Math.max(0, Math.floor(center - radius));
    const last = Math.min(series.length - 1, Math.ceil(center + radius));
    let weighted = 0;
    let weightTotal = 0;
    for (let index = first; index <= last; index += 1) {
      const distance = Math.abs(index - center);
      const weight = radius > 0 ? Math.max(.08, 1 - distance / (radius + 1)) : 1;
      weighted += clamp(Number(series[index]) || 0, 0, 255) / 255 * weight;
      weightTotal += weight;
    }
    return weightTotal ? clamp(weighted / weightTotal, 0, 1) : null;
  };

  const sectionFeature = (section) => Object.freeze({
    energy: clamp(Number(section?.energy) || 0, 0, 1),
    bass: clamp(Number(section?.bass) || 0, 0, 1),
    mids: clamp(Number(section?.mids) || 0, 0, 1),
    highs: clamp(Number(section?.highs) || 0, 0, 1)
  });

  const sectionFeatureDistance = (left, right) => (
    Math.abs(left.energy - right.energy) * .34
    + Math.abs(left.bass - right.bass) * .24
    + Math.abs(left.mids - right.mids) * .22
    + Math.abs(left.highs - right.highs) * .2
  );

  const motifName = (index) => {
    let value = Math.max(0, Math.floor(index));
    let name = '';
    do {
      name = String.fromCharCode(65 + value % 26) + name;
      value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return `MOTIF ${name}`;
  };

  const classifyMotifs = (sections) => {
    const motifs = [];
    return sections.map((section) => {
      const kind = section?.kind || 'steady';
      const feature = sectionFeature(section);
      let best = null;
      let bestDistance = Infinity;
      for (const motif of motifs) {
        if (motif.kind !== kind) continue;
        const distance = sectionFeatureDistance(feature, motif.feature);
        if (distance < bestDistance) {
          best = motif;
          bestDistance = distance;
        }
      }
      if (!best || bestDistance > .16) {
        best = { id: motifs.length, kind, feature, count: 0 };
        motifs.push(best);
      }
      const occurrence = best.count;
      best.count += 1;
      return Object.freeze({
        id: best.id,
        label: motifName(best.id),
        occurrence,
        similarity: occurrence ? clamp(1 - bestDistance / .16, 0, 1) : 1
      });
    });
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
      const motifAssignments = classifyMotifs(map.sections);
      return map.sections.map((section, index) => {
        const motif = motifAssignments[index];
        const randomA = seedUnit(`${map.key}|${behaviorId}|motif-${motif.id}|a`);
        const randomB = seedUnit(`${map.key}|${behaviorId}|motif-${motif.id}|b`);
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
          motifId: motif.id,
          motifLabel: motif.label,
          motifOccurrence: motif.occurrence,
          motifSimilarity: motif.similarity,
          phrasePhase: randomA * Math.PI * 2,
          phraseCycles: .72 + randomB * .56,
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

    const phraseState = (map, cue, songTime) => {
      if (!cue) return { values: {}, energy: 0, bass: 0, mids: 0, highs: 0, contour: 0, progress: 0 };
      const sectionLength = Math.max(.1, cue.end - cue.start);
      const progress = clamp((songTime - cue.start) / sectionLength, 0, 1);
      const windowSeconds = clamp(sectionLength * .085, 1.4, 4.5);
      const energy = sampleSongSeries(map, 'energy', songTime, windowSeconds) ?? cue.energy ?? .5;
      const bass = sampleSongSeries(map, 'bass', songTime, windowSeconds) ?? 0;
      const mids = sampleSongSeries(map, 'mids', songTime, windowSeconds) ?? 0;
      const highs = sampleSongSeries(map, 'highs', songTime, windowSeconds) ?? 0;
      const contour = clamp(energy - (Number(cue.energy) || .5), -.55, .55);
      const phraseEnvelope = .42 + .58 * Math.sin(Math.PI * progress);
      const phase = (Number(cue.phrasePhase) || 0) + progress * (Number(cue.phraseCycles) || 1) * Math.PI * 2;
      const drift = Math.sin(phase) * phraseEnvelope;
      const counterDrift = Math.cos(phase * .73 + 1.1) * phraseEnvelope;
      const spectralTilt = clamp(highs - bass, -.8, .8);
      const vocalBody = clamp(mids - (bass + highs) * .5, -.6, .6);
      return {
        energy,
        bass,
        mids,
        highs,
        contour,
        progress,
        values: {
          zoom: contour * -.022 + drift * .0045,
          rotationOffset: drift * .009 + spectralTilt * .004,
          panX: drift * .0048,
          panY: counterDrift * .0038,
          equation: contour * .062 + drift * .010 + vocalBody * .008,
          frequencyHue: spectralTilt * .055 + counterDrift * .008,
          flow: Math.max(-.03, contour * .052 + highs * .018 + drift * .006),
          motion: contour * .085 + energy * .026 + drift * .012,
          fractalTilt: mids * .018 + counterDrift * .008,
          fractalSlice: highs * .015 + drift * .006,
          equationFold: Math.max(-.012, contour * .018 + mids * .006),
          equationWarp: contour * .028 + bass * .008 + drift * .005,
          bulbPower: contour * .055 + drift * .018,
          bulbFold: Math.max(-.01, contour * .016 + mids * .005),
          bulbGlow: contour * .065 + highs * .024,
          pulseJagged: contour * .05 + highs * .025
        }
      };
    };

    const dynamicsForValues = (values, phrase) => {
      const domains = Object.freeze({
        camera: clamp(Math.max(
          Math.abs(values.zoom || 0) * 5,
          Math.abs(values.rotationOffset || 0) * 4,
          Math.hypot(values.panX || 0, values.panY || 0) * 12,
          Math.abs(values.motion || 0) * 2.3
        ), 0, 1),
        equation: clamp(Math.max(
          Math.abs(values.equation || 0) * 6,
          Math.abs(values.equationFold || 0) * 20,
          Math.abs(values.equationWarp || 0) * 14
        ), 0, 1),
        color: clamp(Math.max(
          Math.abs(values.frequencyHue || 0) * 5,
          Math.abs(values.flow || 0) * 5,
          Math.abs(values.bulbGlow || 0) * 4
        ), 0, 1),
        depth: clamp(Math.max(
          Math.abs(values.fractalTilt || 0) * 7,
          Math.abs(values.fractalSlice || 0) * 8,
          Math.abs(values.bulbPower || 0) * 3,
          Math.abs(values.bulbFold || 0) * 18
        ), 0, 1)
      });
      const drivers = Object.freeze({
        energy: clamp(Math.abs(phrase.contour || 0) * 1.6 + (phrase.energy || 0) * .38, 0, 1),
        bass: clamp((phrase.bass || 0) * .82, 0, 1),
        mids: clamp((phrase.mids || 0) * .78, 0, 1),
        highs: clamp((phrase.highs || 0) * .82, 0, 1)
      });
      const strongest = (entries) => entries.reduce((best, entry) => entry[1] > best[1] ? entry : best, entries[0]);
      const [target, targetLevel] = strongest(Object.entries(domains));
      const [driver, driverLevel] = strongest(Object.entries(drivers));
      return Object.freeze({ domains, drivers, target, targetLevel, driver, driverLevel });
    };

    const evaluate = ({
      plan,
      map,
      time,
      styleId = 'cinematic',
      transitionId = 'auto',
      intensity = 1,
      getOverride = () => null,
      dimensionalEnabled = true,
      foldingEnabled = true
    } = {}) => {
      const requestedTime = Number(time) || 0;
      if (!map || !Array.isArray(plan) || !plan.length) return { values: {}, cue: null, songTime: requestedTime, dynamics: null };
      const duration = map.duration || 1;
      const songTime = clamp(requestedTime, 0, duration);
      let index = plan.findIndex((cue) => songTime >= cue.start && songTime < cue.end);
      if (index < 0) index = plan.length - 1;
      const cue = plan[index];
      const previous = plan[Math.max(0, index - 1)];
      const sectionLength = Math.max(.1, cue.end - cue.start);
      const sectionProgress = clamp((songTime - cue.start) / sectionLength, 0, 1);
      const transitionProfile = transitions[transitionId] || transitions.auto;
      const transitionFraction = transitionProfile.fraction ?? cue.transitionFraction ?? .18;
      const transitionSeconds = clamp(sectionLength * transitionFraction, transitionProfile.minimum, transitionProfile.maximum);
      const transitionProgress = index ? clamp((songTime - cue.start) / transitionSeconds, 0, 1) : 1;
      const blend = index ? transitionCurve(transitionProgress, transitionProfile.curve) : 1;
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
      const previousPhrase = phraseState(map, previous, songTime);
      const currentPhrase = phraseState(map, cue, songTime);
      const behavior = behaviors[cue.behaviorId] || behaviors.balanced;
      for (const key of Object.keys(currentPhrase.values)) {
        const from = previousPhrase.values[key] || 0;
        const to = currentPhrase.values[key] || 0;
        const phraseValue = from + (to - from) * blend;
        values[key] = (values[key] || 0)
          + phraseValue * master * styleTargetScale(key, style) * behaviorTargetScale(key, behavior);
      }
      values.phraseEnergy = currentPhrase.energy;
      values.phraseContour = currentPhrase.contour;
      values.phraseProgress = currentPhrase.progress;
      if (!dimensionalEnabled) {
        values.fractalTilt = 0;
        values.fractalSlice = 0;
      }
      if (!foldingEnabled) {
        values.equationFold = 0;
        values.equationWarp = 0;
      }
      return {
        values,
        cue,
        songTime,
        dynamics: dynamicsForValues(values, currentPhrase),
        transition: Object.freeze({
          id: Object.hasOwn(transitions, transitionId) ? transitionId : 'auto',
          label: transitionProfile.label,
          seconds: transitionSeconds,
          progress: transitionProgress
        })
      };
    };

    return Object.freeze({
      styles,
      behaviors,
      transitions,
      classifyMotifs,
      dynamicsForValues,
      resolveBehavior,
      applyOverrideTargets,
      generatePlan,
      evaluate,
      diagnostics: Object.freeze({ ready: true, phraseMotion: true, motifMemory: true })
    });
  }

  window.QuarticSongDirectorEngine = Object.freeze({ create });
})();
