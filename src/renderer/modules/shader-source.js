(() => {
  'use strict';

  const vertexSource = `#version 300 es
    in vec2 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    out vec4 fragColor;
    uniform vec2 uResolution;
    uniform vec2 uSubpixelOffset;
    uniform vec2 uCenter;
    uniform float uScale;
    uniform float uTime;
    uniform float uBass;
    uniform float uMids;
    uniform float uHighs;
    uniform float uRms;
    uniform float uBeat;
    uniform float uMusicClockBass;
    uniform float uMusicClockMids;
    uniform float uMusicClockHighs;
    uniform float uMusicClockRms;
    uniform float uMusicClockBeat;
    uniform float uEquationBass;
    uniform float uEquationMids;
    uniform float uEquationHighs;
    uniform float uEquationBeat;
    uniform float uMusicMotionBass;
    uniform float uMusicMotionMids;
    uniform float uMusicMotionHighs;
    uniform float uMusicMotionBeat;
    uniform float uMappedEquation;
    uniform float uFlow;
    uniform float uMotion;
    uniform float uFractalDimensional;
    uniform float uFractalTilt;
    uniform float uFractalDepthSpeed;
    uniform float uFractalPerspective;
    uniform float uFractalSlice;
    uniform float uFractalLighting;
    uniform float uFractalAudioDepth;
    uniform float uEquationFolding;
    uniform float uEquationFold;
    uniform float uEquationWarp;
    uniform float uEquationFoldMotion;
    uniform float uEquationFoldOffset;
    uniform float uEquationWarpScale;
    uniform float uEquationFoldAudio;
    uniform float uCoreCStrength;
    uniform vec2 uCoreBias;
    uniform float uBarWidth;
    uniform float uBarGlow;
    uniform float uBarReflection;
    uniform float uBarMotion;
    uniform float uBarEcho;
    uniform float uBarGrid;
    uniform float uBarStyle;
    uniform float uRadialSize;
    uniform float uRadialGlow;
    uniform float uRadialWaves;
    uniform float uRadialTwist;
    uniform float uRadialSpokes;
    uniform float uRadialAtmosphere;
    uniform float uPulseJagged;
    uniform float uPulseTrail;
    uniform float uPulseDetail;
    uniform float uPulseSize;
    uniform float uBulbPower;
    uniform float uBulbWarp;
    uniform float uBulbDetail;
    uniform float uBulbAudio;
    uniform float uBulbOrbit;
    uniform float uBulbFold;
    uniform float uBulbGlow;
    uniform float uBulbCamera;
    uniform float uBulbYaw;
    uniform float uBulbPitch;
    uniform int uBulbSteps;
    uniform vec3 uBulbHotspots[3];
    uniform int uPulseEventCount;
    uniform float uPulseEventAge[16];
    uniform float uPulseEventStrength[16];
    uniform float uPulseEventBand[16];
    uniform float uPulseEventSeed[16];
    uniform float uRotation;
    uniform float uEquation;
    uniform float uFrequencyHue;
    uniform float uMappedFrequencyHue;
    uniform float uFrequencyColor;
    uniform int uFractalType;
    uniform int uVisualStyle;
    uniform float uSpectrum[64];
    uniform float uWaveform[64];
    uniform vec3 uCustom0;
    uniform vec3 uCustom1;
    uniform vec3 uCustom2;
    uniform vec3 uCustom3;
    uniform int uIterations;
    uniform int uPalette;
    uniform float uChromaKey;
    uniform float uChromaThreshold;
    uniform float uHdrExport;
    uniform float uExporting;
    vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.2831853 * (c * t + d));
    }

    vec3 fourStopPalette(float t, vec3 shadow, vec3 field, vec3 accent, vec3 detail) {
      float position = fract(t) * 4.0;
      float blend = smoothstep(0.0, 1.0, fract(position));
      if (position < 1.0) return mix(shadow, field, blend);
      if (position < 2.0) return mix(field, accent, blend);
      if (position < 3.0) return mix(accent, detail, blend);
      return mix(detail, shadow, blend);
    }

    float hlgEncode(float linearLight) {
      const float a = 0.17883277;
      const float b = 0.28466892;
      const float c = 0.55991073;
      float value = clamp(linearLight, 0.0, 1.0);
      return value <= (1.0 / 12.0)
        ? sqrt(3.0 * value)
        : a * log(12.0 * value - b) + c;
    }

    vec3 encodeRec2020Hlg(vec3 displayColor) {
      vec3 linear709 = pow(max(displayColor, 0.0), vec3(2.2));
      linear709 = clamp((linear709 / (1.0 + .35 * linear709)) / .74074074, 0.0, 1.0);
      vec3 linear2020 = vec3(
        dot(linear709, vec3(.627404, .329283, .0433136)),
        dot(linear709, vec3(.069097, .919540, .0113612)),
        dot(linear709, vec3(.0163916, .0880132, .895595))
      );
      return vec3(hlgEncode(linear2020.r), hlgEncode(linear2020.g), hlgEncode(linear2020.b));
    }

    vec2 complexMultiply(vec2 a, vec2 b) {
      return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }

    vec2 complexDivide(vec2 numerator, vec2 denominator) {
      float denominatorLength = max(dot(denominator, denominator), 0.00000001);
      return vec2(
        numerator.x * denominator.x + numerator.y * denominator.y,
        numerator.y * denominator.x - numerator.x * denominator.y
      ) / denominatorLength;
    }

    vec3 palette(float t) {
      if (uPalette == 0) {
        return fourStopPalette(t,
          vec3(.035,.067,.145), vec3(.125,.275,.430),
          vec3(.390,.335,.555), vec3(.420,.660,.710));
      }
      if (uPalette == 1) {
        return fourStopPalette(t,
          vec3(.075,.043,.055), vec3(.300,.130,.145),
          vec3(.610,.315,.220), vec3(.790,.585,.345));
      }
      if (uPalette == 2) {
        return fourStopPalette(t,
          vec3(.025,.090,.100), vec3(.070,.280,.285),
          vec3(.250,.465,.380), vec3(.555,.680,.500));
      }
      if (uPalette == 3) {
        return fourStopPalette(t,
          vec3(.030,.040,.060), vec3(.145,.175,.215),
          vec3(.350,.390,.435), vec3(.680,.705,.730));
      }
      float customPosition = fract(t) * 4.0;
      if (customPosition < 1.0) return mix(uCustom0, uCustom1, customPosition);
      if (customPosition < 2.0) return mix(uCustom1, uCustom2, customPosition - 1.0);
      if (customPosition < 3.0) return mix(uCustom2, uCustom3, customPosition - 2.0);
      return mix(uCustom3, uCustom0, customPosition - 3.0);
    }

    float spectrumAt(float position) {
      float samplePosition = clamp(position, 0.0, .9999) * 63.0;
      int first = int(floor(samplePosition));
      int second = min(63, first + 1);
      return mix(uSpectrum[first], uSpectrum[second], fract(samplePosition));
    }

    float waveformAt(float position) {
      float samplePosition = clamp(position, 0.0, .9999) * 63.0;
      int first = int(floor(samplePosition));
      int second = min(63, first + 1);
      return mix(uWaveform[first], uWaveform[second], fract(samplePosition));
    }

    float sourceRingRadius(float phase, float lane) {
      return .075 + .050 * lane + .032 * phase;
    }

    float expandingWave(float radius, float phase, float sharpness, float lane) {
      float waveRadius = sourceRingRadius(phase, lane);
      float life = pow(1.0 - phase, 1.25);
      float core = exp(-abs(radius - waveRadius) * sharpness * 1.32);
      float innerRidge = exp(-abs(radius - (waveRadius - .010)) * sharpness * 1.58);
      float outerRidge = exp(-abs(radius - (waveRadius + .009)) * sharpness * 1.68);
      return (core + (innerRidge * .23 + outerRidge * .18) * uPulseDetail) * life;
    }

    float jaggedProfile(float angle, float time, float broad, float medium, float fine) {
      return .56 * sin(angle * broad + time * .83)
        + .29 * sin(angle * medium - time * 1.17)
        + .15 * sin(angle * fine + time * 1.61);
    }

    float sourceRingTrail(float radius, float phase, float width, float lane) {
      float sourceRadius = sourceRingRadius(phase, lane);
      float behind = sourceRadius - radius;
      float separated = smoothstep(0.0, width * .18, behind);
      float trailBody = step(0.0, behind) * separated * exp(-behind / max(.001, width)) * pow(1.0 - phase, .72);
      float contour = pow(.5 + .5 * cos(behind * (510.0 + lane * 95.0) - uTime * (.72 + lane * .16)), 9.0);
      float fineContour = pow(.5 + .5 * cos(behind * (910.0 + lane * 120.0) + uTime * .38), 14.0);
      float detailMask = mix(1.0, .16 + .70 * contour + .24 * fineContour, clamp(uPulseDetail, 0.0, 1.0));
      return trailBody * detailMask;
    }

    vec3 musicEmittedWaves(float radius, float angle) {
      vec3 waves = vec3(0.0);
      float frequencyShift = uFrequencyHue * uFrequencyColor + uMappedFrequencyHue;
      for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
        if (eventIndex >= uPulseEventCount) break;
        float age = uPulseEventAge[eventIndex];
        float strength = uPulseEventStrength[eventIndex];
        float band = uPulseEventBand[eventIndex];
        float eventActive = step(0.0, age);
        float travelSpeed = .27;
        float palettePosition = .12;
        float eventJagged = jaggedProfile(angle, uTime, 11.0, 19.0, 31.0);
        if (band > .5 && band < 1.5) {
          travelSpeed = .23;
          palettePosition = .47;
          eventJagged = jaggedProfile(angle, uTime * 1.08, 23.0, 41.0, 67.0);
        } else if (band >= 1.5) {
          travelSpeed = .20;
          palettePosition = .82;
          eventJagged = jaggedProfile(angle, uTime * 1.22, 37.0, 73.0, 109.0);
        }
        float displacedRadius = radius - eventJagged * uPulseJagged * (.002 + .017 * strength);
        float waveRadius = .090 + band * .050 + max(0.0, age) * travelSpeed;
        float sharpness = 58.0 + 24.0 * strength;
        float waveCore = exp(-abs(displacedRadius - waveRadius) * sharpness);
        float echo1 = exp(-abs(displacedRadius - (waveRadius - .014)) * sharpness * 1.14);
        float echo2 = exp(-abs(displacedRadius - (waveRadius - .027)) * sharpness * 1.22);
        float echo3 = exp(-abs(displacedRadius - (waveRadius - .041)) * sharpness * 1.30);
        float detailedCore = waveCore + (echo1 * .31 + echo2 * .23 + echo3 * .16) * uPulseDetail;
        float behind = waveRadius - displacedRadius;
        float trailContour = pow(.5 + .5 * cos(behind * (430.0 + band * 90.0) - age * 4.2), 10.0);
        float waveTrail = step(0.0, behind)
          * smoothstep(0.0, .008, behind)
          * exp(-behind * 25.0)
          * mix(1.0, .14 + .86 * trailContour, clamp(uPulseDetail, 0.0, 1.0))
          * .13 * uPulseTrail;
        float distanceFade = 1.0 - smoothstep(.56, .92, waveRadius);
        float timeFade = exp(-max(0.0, age) * .78);
        waves += palette(palettePosition + frequencyShift)
          * (detailedCore + waveTrail)
          * eventActive * distanceFade * timeFade
          * (.13 + .64 * strength);
      }
      return waves;
    }

    mat2 bulbRotation(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    float bulbDirectionalHotspot(vec3 direction, vec3 origin, float sharpness) {
      return pow(clamp(.5 + .5 * dot(direction, origin), 0.0, 1.0), sharpness);
    }

    float localizedBulbDeformation(vec3 point) {
      vec3 direction = point / max(length(point), .0001);
      float bassRegion = bulbDirectionalHotspot(direction, uBulbHotspots[0], 13.0) * uEquationBass;
      float midRegion = bulbDirectionalHotspot(direction, uBulbHotspots[1], 16.0) * uEquationMids;
      float highRegion = bulbDirectionalHotspot(direction, uBulbHotspots[2], 20.0) * uEquationHighs;
      vec3 beatOrigin = normalize(uBulbHotspots[0] - uBulbHotspots[1] + uBulbHotspots[2] + vec3(.001));
      float beatRegion = bulbDirectionalHotspot(direction, beatOrigin, 24.0) * uEquationBeat;
      float breathing = .72 + .28 * sin(uTime * (1.35 + .55 * uMotion)
        + dot(direction, vec3(2.7, 4.1, 3.3)));
      return uBulbAudio * breathing
        * (.0090 * bassRegion + .0070 * midRegion + .0045 * highRegion + .0120 * beatRegion);
    }

    float bulbHash(float seed) {
      return fract(sin(seed * 127.1 + 311.7) * 43758.5453123);
    }

    vec3 bulbEventDirection(float seed) {
      float vertical = bulbHash(seed + 2.13) * 2.0 - 1.0;
      float angle = bulbHash(seed + 8.71) * 6.2831853;
      float horizontal = sqrt(max(0.0, 1.0 - vertical * vertical));
      return vec3(horizontal * cos(angle), vertical, horizontal * sin(angle));
    }

    vec3 localizedBulbPulseLight(vec3 point, float frequencyShift) {
      vec3 direction = point / max(length(point), .0001);
      vec3 pulseLight = vec3(0.0);
      for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
        if (eventIndex >= uPulseEventCount) break;
        float age = uPulseEventAge[eventIndex];
        float strength = uPulseEventStrength[eventIndex];
        float band = uPulseEventBand[eventIndex];
        float seed = uPulseEventSeed[eventIndex] + band * 17.31;
        vec3 origin = bulbEventDirection(seed);
        float surfaceDistance = length(direction - origin);
        float waveRadius = .035 + max(0.0, age) * (.30 + band * .035);
        float sharpness = 25.0 + band * 5.0;
        float wave = exp(-abs(surfaceDistance - waveRadius) * sharpness);
        float behind = waveRadius - surfaceDistance;
        float trail = step(0.0, behind) * exp(-behind * 7.5)
          * (.28 + .72 * pow(.5 + .5 * cos(behind * (58.0 + band * 11.0) - age * 2.2), 6.0));
        float sourceFlash = exp(-surfaceDistance * 23.0) * exp(-max(0.0, age) * 2.8);
        float life = exp(-max(0.0, age) * .62)
          * (1.0 - smoothstep(1.72, 2.02, waveRadius));
        float colorPosition = .10 + band * .34 + frequencyShift + seed * .013;
        pulseLight += palette(colorPosition)
          * (wave + trail * .24 + sourceFlash * 1.35)
          * life * strength;
      }
      return pulseLight * uBulbAudio;
    }

    float mandelbulbDistance(vec3 point) {
      // Mandelbulb azimuth wraps at -PI/+PI. Fractional powers turn that
      // harmless coordinate wrap into a visible split, so recurrence power
      // stays integral and music deforms the domain in Cartesian space.
      float power = floor(clamp(uBulbPower, 2.0, 10.0) + .5);
      float foldAmount = clamp(uBulbFold + (.10 * uEquationMids + .07 * uEquationBeat) * uBulbAudio, 0.0, 1.0);
      float musicWarp = uBulbAudio * (
        .0100 * uEquationBass
        + .0080 * uEquationMids
        + .0060 * uEquationHighs
        + .0120 * uEquationBeat
      );
      vec3 recurrenceWarp = vec3(
        sin(point.y * 3.1 + point.z * 1.7 + uTime * .37),
        sin(point.z * 3.7 + point.x * 1.3 - uTime * .31),
        sin(point.x * 3.3 + point.y * 1.9 + uTime * .29)
      );
      recurrenceWarp += .35 * vec3(
        sin(point.z * 5.1 - point.y * 2.3 - uTime * .23),
        sin(point.x * 4.7 - point.z * 2.1 + uTime * .27),
        sin(point.y * 4.9 - point.x * 2.5 - uTime * .19)
      );
      vec3 recurrencePoint = point + recurrenceWarp * (musicWarp + uBulbWarp * .018);
      vec3 z = recurrencePoint;
      float derivative = 1.0;
      float radius = 0.0;
      int detailIterations = 5 + int(floor(clamp(uBulbDetail, 0.0, 1.0) * 6.0));
      for (int iteration = 0; iteration < 12; iteration++) {
        if (iteration >= detailIterations) break;
        radius = length(z);
        if (radius > 3.2) break;
        float safeRadius = max(radius, 0.00001);
        float theta = acos(clamp(z.z / safeRadius, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        float radiusPower = pow(safeRadius, power);
        derivative = pow(safeRadius, power - 1.0) * power * derivative + 1.0;
        theta *= power;
        phi *= power;
        z = radiusPower * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + recurrencePoint;
        vec3 folded = abs(z) - vec3(.16 + .10 * sin(uTime * .21), .12, .18);
        z = mix(z, folded, foldAmount * .32);
      }
      float distanceEstimate = .5 * log(max(radius, 0.00001)) * radius / max(derivative, 0.00001);
      return distanceEstimate - localizedBulbDeformation(point);
    }

    vec3 mandelbulbNormal(vec3 point) {
      float epsilon = .0018;
      vec2 offset = vec2(epsilon, 0.0);
      return normalize(vec3(
        mandelbulbDistance(point + offset.xyy) - mandelbulbDistance(point - offset.xyy),
        mandelbulbDistance(point + offset.yxy) - mandelbulbDistance(point - offset.yxy),
        mandelbulbDistance(point + offset.yyx) - mandelbulbDistance(point - offset.yyx)
      ));
    }

    float mandelbulbOcclusion(vec3 point, vec3 normal) {
      float occlusion = 0.0;
      float weight = 1.0;
      for (int sampleIndex = 1; sampleIndex <= 4; sampleIndex++) {
        float distanceAlongNormal = .018 * float(sampleIndex);
        occlusion += max(0.0, distanceAlongNormal - mandelbulbDistance(point + normal * distanceAlongNormal)) * weight;
        weight *= .62;
      }
      return clamp(1.0 - occlusion * 6.2, .12, 1.0);
    }

    vec3 renderMandelbulb(vec2 uv, float frequencyShift) {
      float idleMotion = .08 + .22 * uMotion;
      float orbitAngle = uBulbYaw + uTime * uBulbOrbit * idleMotion
        + sin(uTime * .27) * .06 * uEquationMids * uBulbAudio;
      float pitch = clamp(uBulbPitch + sin(uTime * .19) * .040 * uEquationMids * uBulbAudio, -1.25, 1.25);
      float cameraDistance = uBulbCamera * (1.0 - .035 * uEquationBass * uBulbAudio - .018 * uEquationBeat * uBulbAudio);
      vec3 rayOrigin = cameraDistance * vec3(cos(pitch) * sin(orbitAngle), sin(pitch), cos(pitch) * cos(orbitAngle));
      vec3 target = vec3(0.0, -.035 + .035 * uEquationBass * uBulbAudio, 0.0);
      vec3 forward = normalize(target - rayOrigin);
      vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(right, forward);
      vec3 rayDirection = normalize(forward * 1.72 + right * uv.x + up * uv.y);

      float travel = 0.0;
      float closestDistance = 10.0;
      float hit = 0.0;
      for (int stepIndex = 0; stepIndex < 192; stepIndex++) {
        if (stepIndex >= uBulbSteps) break;
        vec3 point = rayOrigin + rayDirection * travel;
        float distanceToSurface = mandelbulbDistance(point);
        closestDistance = min(closestDistance, abs(distanceToSurface));
        float threshold = .00075 * (1.0 + travel * .12);
        if (distanceToSurface < threshold) {
          hit = 1.0;
          break;
        }
        travel += max(distanceToSurface * .78, .00055);
        if (travel > 8.0) break;
      }

      float skyGradient = .5 + .5 * rayDirection.y;
      float nebula = pow(max(0.0, dot(rayDirection, normalize(vec3(-.45, .28, -.84)))), 5.0);
      float starNoise = fract(sin(dot(floor((rayDirection.xy + rayDirection.z) * 420.0), vec2(12.9898, 78.233))) * 43758.5453);
      float stars = pow(starNoise, 46.0) * (.16 + .84 * uHighs);
      vec3 background = palette(.58 + skyGradient * .18 + frequencyShift + uTime * .002)
        * (.006 + .022 * nebula + .012 * uRms);
      background += palette(.12 + frequencyShift) * stars * .32;
      if (hit < .5) {
        float aura = exp(-closestDistance * (18.0 - 6.0 * uBulbGlow));
        return background + palette(.72 + frequencyShift + uTime * .008) * aura * (.025 + .075 * uBulbGlow + .07 * uEquationBeat);
      }

      vec3 point = rayOrigin + rayDirection * travel;
      vec3 normal = mandelbulbNormal(point);
      vec3 keyLight = normalize(vec3(-.7, .9, .45));
      vec3 fillLight = normalize(vec3(.65, -.18, -.72));
      float diffuse = max(0.0, dot(normal, keyLight));
      float fill = max(0.0, dot(normal, fillLight));
      float rim = pow(1.0 - max(0.0, dot(normal, -rayDirection)), 2.4);
      vec3 halfVector = normalize(keyLight - rayDirection);
      float specular = pow(max(0.0, dot(normal, halfVector)), 38.0 - 12.0 * uEquationHighs);
      float occlusion = mandelbulbOcclusion(point, normal);
      vec3 objectDirection = point / max(length(point), .0001);
      float seamlessField = dot(
        sin(point * vec3(3.7, 4.3, 5.1) + vec3(.4, 2.1, 4.2)),
        vec3(.085, .070, .055)
      ) + dot(
        cos(point.yzx * vec3(5.3, 3.1, 4.7) + vec3(1.7, .2, 3.4)),
        vec3(.050, .042, .036)
      );
      float directionalField = dot(objectDirection, normalize(vec3(.61, -.37, .70))) * .11;
      float surfaceBands = length(point) * (.52 + .12 * uEquationHighs)
        + seamlessField + directionalField + uTime * uFlow * .018 + frequencyShift;
      vec3 surface = palette(surfaceBands);
      vec3 secondary = palette(surfaceBands + .31 + .08 * uEquationMids);
      vec3 color = surface * (.12 + diffuse * 1.05 + fill * .28) * occlusion;
      color += secondary * rim * (.18 + .42 * uBulbGlow + .12 * uEquationHighs);
      color += vec3(.88, .96, 1.0) * specular * (.22 + .75 * uBulbGlow);
      color += palette(surfaceBands + .58) * (.035 * uEquationBass + .055 * uEquationBeat) * uBulbAudio;
      color += localizedBulbPulseLight(point, frequencyShift) * (.18 + .52 * uBulbGlow);
      float fog = 1.0 - exp(-travel * .045);
      return mix(color, background, fog);
    }

    float mainframeHash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float mainframeNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(mainframeHash21(cell), mainframeHash21(cell + vec2(1.0, 0.0)), local.x),
        mix(mainframeHash21(cell + vec2(0.0, 1.0)), mainframeHash21(cell + vec2(1.0)), local.x),
        local.y
      );
    }

    vec3 mainframeNeonColor(float position) {
      vec3 source = palette(position);
      float luminance = dot(source, vec3(.2126, .7152, .0722));
      return max(vec3(0.0), vec3(luminance) + (source - vec3(luminance)) * 1.72) * 1.82;
    }

    float mainframeTerrainHeight(vec2 position, float bassDrive, float midDrive) {
      float x = position.x;
      float z = position.y;
      float rolling = sin(x * .54 + sin(z * .19) * 1.6) * .24;
      rolling += sin(x * 1.17 - z * .21) * .13;
      rolling += sin(x * 2.31 + z * .08) * .055;
      float ridge = pow(.5 + .5 * sin(x * .39 + z * .27 + sin(z * .085) * 2.1), 5.0) * .48;
      float centerPeak = exp(-length(vec2(x * .19, (z - 14.0) * .15))) * 3.15;
      float leftPeak = exp(-length(vec2((x + 8.6) * .34, (z - 11.0) * .21))) * 1.55;
      float rightPeak = exp(-length(vec2((x - 8.2) * .38, (z - 10.5) * .22))) * 1.40;
      float audioRelief = sin(x * 1.8 + z * .42 - uTime * .45) * (.035 * midDrive);
      return .08 + rolling + ridge + centerPeak + leftPeak + rightPeak + audioRelief + bassDrive * .035;
    }

    float mainframeSdBox(vec2 point, vec2 bounds) {
      vec2 distance = abs(point) - bounds;
      return length(max(distance, 0.0)) + min(max(distance.x, distance.y), 0.0);
    }

    vec3 renderMainframeLandscape(vec2 screenUv, float frequencyShift) {
      float outputAspect = uResolution.x / max(1.0, uResolution.y);
      vec2 view = (screenUv - .5) * vec2(outputAspect, 1.0);
      float bassDrive = pow(clamp(uEquationBass * 1.45 + uBass * .68 + uRms * .16, 0.0, 1.0), .62);
      float midDrive = pow(clamp(uEquationMids * 1.42 + uMids * .65 + uRms * .12, 0.0, 1.0), .65);
      float highDrive = pow(clamp(uEquationHighs * 1.40 + uHighs * .64, 0.0, 1.0), .68);
      float beatDrive = pow(clamp(max(uEquationBeat, uBeat) * 1.22, 0.0, 1.0), .72);
      vec3 lowColor = mainframeNeonColor(.82 + frequencyShift);
      vec3 midColor = mainframeNeonColor(.46 + frequencyShift);
      vec3 highColor = mainframeNeonColor(.66 + frequencyShift);

      float cameraSway = sin(uTime * .085) * (.10 + .16 * uMotion) + sin(uTime * .031) * .12;
      vec3 rayOrigin = vec3(cameraSway, 2.05 + beatDrive * .045, -4.2);
      vec3 rayDirection = normalize(vec3(view.x * 1.18, view.y - .075, 1.32));

      float skyFade = smoothstep(-.20, .55, rayDirection.y);
      vec3 color = vec3(.0015, .004, .011);
      color += mix(lowColor, highColor, skyFade) * (.012 + .024 * skyFade + .026 * uRms);
      float horizonGlow = exp(-abs(rayDirection.y) * 23.0);
      color += midColor * horizonGlow * (.05 + .12 * midDrive);

      vec2 starCell = floor(screenUv * vec2(420.0, 240.0));
      float starRandom = mainframeHash21(starCell);
      float star = pow(starRandom, 92.0) * smoothstep(.52, .68, screenUv.y);
      float starPulse = .55 + .45 * sin(uTime * (1.0 + starRandom * 2.6) + starRandom * 30.0);
      color += mix(vec3(.56, .75, 1.0), highColor, starRandom) * star * starPulse * (.38 + .52 * highDrive);
      vec2 nebulaPoint = vec2(view.x * .62 + view.y * .34, view.y * 1.9);
      float nebulaBand = exp(-abs(nebulaPoint.x - .17) * 5.2) * smoothstep(.57, .96, screenUv.y);
      float nebulaDust = mainframeNoise(nebulaPoint * 6.0 + vec2(uTime * .004, 0.0));
      color += mix(lowColor, vec3(.32, .40, .72), .55) * nebulaBand * nebulaDust * .028;

      float skylineX = (screenUv.x - .5) * 96.0;
      float towerCell = floor(skylineX);
      float towerRandom = mainframeHash21(vec2(towerCell, 17.0));
      float towerLocal = abs(fract(skylineX) - .5);
      float towerHeight = .018 + pow(towerRandom, 2.4) * .15;
      towerHeight *= .60 + .65 * spectrumAt(fract(towerCell * .071));
      float towerBody = (1.0 - smoothstep(.30, .47, towerLocal))
        * step(.535, screenUv.y) * step(screenUv.y, .535 + towerHeight);
      float towerEdge = smoothstep(.35, .47, towerLocal) * towerBody;
      float towerScan = pow(.5 + .5 * cos((screenUv.y - .535) * 430.0 - uTime * (2.0 + 4.0 * uFlow)), 14.0);
      color += lowColor * towerBody * (.07 + .15 * towerScan + .10 * highDrive);
      color += highColor * towerEdge * (.17 + .30 * highDrive);

      float summitY = clamp((screenUv.y - .535) / .255, 0.0, 1.0);
      float summitHalfWidth = .155 * pow(1.0 - summitY, .78) + .006;
      float summitX = abs(screenUv.x - .5);
      float summitMask = step(.535, screenUv.y) * step(screenUv.y, .79)
        * (1.0 - smoothstep(summitHalfWidth - .006, summitHalfWidth, summitX));
      float summitEdge = exp(-abs(summitX - summitHalfWidth) * 720.0) * step(.535, screenUv.y) * step(screenUv.y, .79);
      float summitContours = pow(.5 + .5 * cos((screenUv.y - .535) * 198.0 + summitX * 48.0), 24.0);
      float summitRibs = pow(.5 + .5 * cos(summitX / max(.008, summitHalfWidth) * 25.0), 28.0);
      color += mix(lowColor, highColor, summitY) * summitMask
        * (.018 + .16 * summitContours + .11 * summitRibs) * (1.0 + midDrive * .55);
      color += highColor * summitEdge * (.20 + .42 * beatDrive);
      float summitBeacon = exp(-abs(screenUv.x - .5) * 760.0)
        * step(.785, screenUv.y) * step(screenUv.y, .86);
      color += lowColor * summitBeacon * (.17 + .52 * beatDrive);

      float travel = .35;
      float hit = 0.0;
      vec3 terrainPoint = rayOrigin;
      for (int march = 0; march < 72; march++) {
        terrainPoint = rayOrigin + rayDirection * travel;
        float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
        float clearance = terrainPoint.y - height;
        if (clearance < .006) {
          hit = 1.0;
          break;
        }
        travel += clamp(clearance * .34, .03, .30);
        if (travel > 38.0) break;
      }

      if (hit > .5) {
        for (int refine = 0; refine < 4; refine++) {
          float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
          travel -= (terrainPoint.y - height) * .36;
          terrainPoint = rayOrigin + rayDirection * travel;
        }
        float epsilon = .035;
        float height = mainframeTerrainHeight(terrainPoint.xz, bassDrive, midDrive);
        float heightX = mainframeTerrainHeight(terrainPoint.xz + vec2(epsilon, 0.0), bassDrive, midDrive);
        float heightZ = mainframeTerrainHeight(terrainPoint.xz + vec2(0.0, epsilon), bassDrive, midDrive);
        vec3 normal = normalize(vec3(height - heightX, epsilon, height - heightZ));
        float diffuse = .22 + .78 * max(0.0, dot(normal, normalize(vec3(-.45, .86, -.28))));
        float rim = pow(1.0 - max(0.0, dot(normal, -rayDirection)), 2.2);

        float distanceFade = exp(-travel * .038);
        vec3 terrainColor = vec3(.014, .034, .088) * (.72 + diffuse * 1.02);
        terrainColor += mix(lowColor, highColor, clamp(.22 + height * .16, 0.0, 1.0))
          * (.035 + diffuse * .042);
        terrainColor += mix(lowColor, midColor, clamp(height * .22, 0.0, 1.0)) * rim * .28;

        float gridX = pow(.5 + .5 * cos(terrainPoint.x * 6.2831853), 26.0);
        float gridZ = pow(.5 + .5 * cos(terrainPoint.z * 6.2831853), 24.0);
        float majorX = pow(.5 + .5 * cos(terrainPoint.x * 1.5707963), 42.0);
        float majorZ = pow(.5 + .5 * cos(terrainPoint.z * 1.5707963), 40.0);
        float contours = pow(.5 + .5 * cos(height * 15.5), 34.0);
        float wireGrid = max(max(gridX, gridZ) * .34, max(majorX, majorZ) * .78);
        terrainColor += lowColor * wireGrid * (.68 + .56 * highDrive) * distanceFade;
        terrainColor += midColor * contours * (.30 + .36 * midDrive) * distanceFade;

        float centerPath = exp(-abs(terrainPoint.x - sin(terrainPoint.z * .18) * 1.15) * 2.8);
        float leftPath = exp(-abs(terrainPoint.x + 4.4 + sin(terrainPoint.z * .24 + 1.7) * 1.5) * 3.2);
        float rightPath = exp(-abs(terrainPoint.x - 4.8 - sin(terrainPoint.z * .20 + .8) * 1.25) * 3.0);
        float packetClock = uTime * (4.0 + 7.0 * uFlow) + uMusicClockBass * 3.5;
        float centerPackets = pow(.5 + .5 * cos(terrainPoint.z * 4.7 - packetClock), 17.0);
        float sidePackets = pow(.5 + .5 * cos(terrainPoint.z * 5.6 - packetClock * 1.18), 20.0);
        terrainColor += lowColor * centerPath * (.44 + 1.28 * centerPackets) * (1.0 + bassDrive * .82);
        terrainColor += midColor * leftPath * (.36 + 1.24 * sidePackets) * (1.0 + midDrive * .78);
        terrainColor += highColor * rightPath * (.36 + 1.24 * sidePackets) * (1.0 + highDrive * .80);

        vec2 dataCell = floor(vec2(terrainPoint.x * 2.2, (terrainPoint.z - uTime * (2.2 + 3.0 * uFlow)) * 2.6));
        vec2 dataLocal = fract(vec2(terrainPoint.x * 2.2, (terrainPoint.z - uTime * (2.2 + 3.0 * uFlow)) * 2.6));
        float bitRandom = mainframeHash21(dataCell);
        float bit = step(.58, bitRandom)
          * smoothstep(.42, .30, abs(dataLocal.x - .5))
          * smoothstep(.38, .25, abs(dataLocal.y - .5));
        float dataField = max(centerPath, max(leftPath, rightPath));
        terrainColor += mix(lowColor, highColor, bitRandom) * bit * dataField * (.34 + .72 * highDrive);

        for (int eventIndex = 0; eventIndex < 16; eventIndex++) {
          if (eventIndex >= uPulseEventCount) break;
          float age = max(0.0, uPulseEventAge[eventIndex]);
          float strength = uPulseEventStrength[eventIndex];
          float band = uPulseEventBand[eventIndex];
          float radius = 1.2 + age * (3.7 + band * .55);
          float ring = exp(-abs(length(terrainPoint.xz - vec2(0.0, 3.0)) - radius) * 3.4);
          terrainColor += palette(.08 + band * .34 + frequencyShift) * ring * strength * exp(-age * .65) * .55;
        }

        float peakBeacon = exp(-abs(terrainPoint.x) * 2.2) * exp(-abs(terrainPoint.z - 14.0) * .8);
        terrainColor += highColor * peakBeacon * (.34 + .86 * beatDrive);
        float fog = 1.0 - exp(-travel * .055);
        vec3 fogColor = mix(vec3(.004, .010, .026), midColor * .09, horizonGlow);
        color = mix(terrainColor, fogColor, fog) + terrainColor * distanceFade * .28;
      }

      float rainSide = smoothstep(.10, .015, screenUv.x) + smoothstep(.90, .985, screenUv.x);
      vec2 rainCell = floor(vec2(screenUv.x * 150.0, (screenUv.y + uTime * (.10 + .22 * uFlow)) * 94.0));
      vec2 rainLocal = fract(vec2(screenUv.x * 150.0, (screenUv.y + uTime * (.10 + .22 * uFlow)) * 94.0));
      float rainRandom = mainframeHash21(vec2(rainCell.x, floor(rainCell.y * .13)));
      float rainGlyph = step(.42, rainRandom) * smoothstep(.40, .25, abs(rainLocal.x - .5))
        * smoothstep(.43, .26, abs(rainLocal.y - .5));
      color += mix(lowColor, highColor, rainRandom) * rainGlyph * rainSide * (.20 + .52 * highDrive);

      float leftPanel = exp(-abs(mainframeSdBox((screenUv - vec2(.205, .795)) * vec2(outputAspect, 1.0), vec2(.145, .078))) * 520.0);
      float rightPanel = exp(-abs(mainframeSdBox((screenUv - vec2(.805, .805)) * vec2(outputAspect, 1.0), vec2(.13, .088))) * 520.0);
      float panelMask = leftPanel + rightPanel;
      color += lowColor * panelMask * (.20 + .24 * highDrive);
      float panelWaveX = clamp((screenUv.x - .105) / .20, 0.0, 1.0);
      float panelWave = waveformAt(panelWaveX) * (.020 + .022 * uRms);
      float panelTrace = exp(-abs(screenUv.y - (.795 + panelWave)) * 390.0)
        * step(.105, screenUv.x) * step(screenUv.x, .305)
        * step(.735, screenUv.y) * step(screenUv.y, .855);
      color += midColor * panelTrace * (.24 + .62 * midDrive);
      float panelRows = pow(.5 + .5 * cos(screenUv.y * 520.0), 20.0)
        * step(.725, screenUv.x) * step(screenUv.x, .885)
        * step(.75, screenUv.y) * step(screenUv.y, .86);
      color += highColor * panelRows * (.035 + .11 * highDrive);

      vec2 reticlePoint = (screenUv - vec2(.69, .72)) * vec2(outputAspect, 1.0);
      float reticleRadius = length(reticlePoint);
      float reticle = exp(-abs(reticleRadius - .045 - beatDrive * .004) * 440.0)
        + exp(-abs(reticleRadius - .027) * 390.0) * .55;
      float reticleCross = exp(-abs(reticlePoint.x) * 700.0) * step(abs(reticlePoint.y), .062)
        + exp(-abs(reticlePoint.y) * 700.0) * step(abs(reticlePoint.x), .062);
      color += lowColor * (reticle + reticleCross * .24) * (.14 + .34 * beatDrive);

      float scanline = pow(.5 + .5 * cos(screenUv.y * uResolution.y * 3.1415926), 26.0);
      color *= .985 + scanline * .015;
      return color / (1.0 + color * .22);
    }

    void main() {
      vec2 sampleCoord = gl_FragCoord.xy + uSubpixelOffset;
      vec2 p = (sampleCoord - .5 * uResolution.xy) / uResolution.y;
      float cs = cos(uRotation);
      float sn = sin(uRotation);
      p = mat2(cs, -sn, sn, cs) * p;
      float breathing = sin(uTime * .72 + uMusicClockMids * .12) * .009 * uMotion;
      float pulse = 1.0 - .035 * uEquationBeat * uMotion - .012 * uEquationBass * uMotion + breathing;
      vec3 dimensionalPoint = vec3(p, 0.0);
      vec2 dimensionalPlane = p;
      float dimensionalLight = 1.0;
      float depthSheen = 0.0;
      if (uFractalDimensional > .5) {
        float depthAudio = 1.0 + uFractalAudioDepth * (.12 * uEquationBass + .09 * uEquationMids + .05 * uEquationBeat);
        float depthPhase = uFractalDepthSpeed
          * (uTime * .55 + uMusicClockMids * .14 * uFractalAudioDepth);
        float tiltAmount = uFractalTilt * depthAudio;
        float tiltX = sin(depthPhase) * tiltAmount * .82;
        float tiltY = cos(depthPhase * .83) * tiltAmount * .68;
        float cosY = cos(tiltY);
        float sinY = sin(tiltY);
        dimensionalPoint = vec3(
          cosY * dimensionalPoint.x + sinY * dimensionalPoint.z,
          dimensionalPoint.y,
          -sinY * dimensionalPoint.x + cosY * dimensionalPoint.z
        );
        float cosX = cos(tiltX);
        float sinX = sin(tiltX);
        dimensionalPoint = vec3(
          dimensionalPoint.x,
          cosX * dimensionalPoint.y - sinX * dimensionalPoint.z,
          sinX * dimensionalPoint.y + cosX * dimensionalPoint.z
        );
        float perspectiveDepth = max(.42,
          1.0 + dimensionalPoint.z * uFractalPerspective * 1.65);
        dimensionalPlane = dimensionalPoint.xy / perspectiveDepth;
        vec2 sliceDirection = vec2(cos(depthPhase * 1.31), sin(depthPhase * 1.17));
        dimensionalPlane += dimensionalPoint.z * sliceDirection
          * uFractalSlice * (.22 + .08 * uEquationMids * uFractalAudioDepth);
        dimensionalLight = clamp(
          1.0 + dimensionalPoint.z * uFractalLighting,
          .65, 1.40
        );
        depthSheen = pow(clamp(.5 + dimensionalPoint.z, 0.0, 1.0), 3.0)
          * .10 * uFractalLighting;
      }
      vec2 c = uCenter + dimensionalPlane * uScale * pulse;
      float coreCScale = mix(.35, 1.65, uCoreCStrength);
      vec2 recurrenceC = c * coreCScale + uCoreBias;
      // Musical motion is kept separate from the slower equation/color
      // envelopes. It follows rhythmic contrast without turning each onset
      // into a full-frame brightness flash.
      vec2 musicalRecurrenceDrift = uEquation * vec2(
        (.010 * uMusicMotionBass + .006 * uMusicMotionBeat) * sin(uTime * .71),
        (.008 * uMusicMotionMids - .003 * uMusicMotionHighs) * cos(uTime * .89)
      );
      musicalRecurrenceDrift += uMappedEquation * vec2(
        .014 * sin(uTime * .79),
        .011 * cos(uTime * 1.03)
      );
      recurrenceC += musicalRecurrenceDrift;
      float frequencyShift = uFrequencyHue * uFrequencyColor + uMappedFrequencyHue;
      vec3 color = vec3(0.0);
      if (uVisualStyle == 0) {
      vec2 z = vec2(0.0);
      if (uFractalType == 5 || uFractalType == 18) z = c;
      else if (uFractalType == 14) z = vec2(.5, 0.0);
      else if (uFractalType == 17) z = vec2(1.0, 0.0);
      vec2 previousZ = vec2(0.0);
      vec2 dynamicC = recurrenceC;
      float minTrap = 100.0;
      float minAxis = 100.0;
      float convergenceHit = 0.0;
      int escapedAt = uIterations;

      float trapAngle = (uTime * .12 + uMusicClockHighs * .12) * uMotion
        + .09 * uMusicMotionHighs;
      vec2 trapDir = vec2(cos(trapAngle), sin(trapAngle));
      vec2 equationMu = uEquation * vec2(
        (.070 * uEquationBass + .025 * uEquationBeat) * cos(uTime * .43)
          + .040 * uMusicMotionBass * sin(uTime * 1.13)
          + .018 * uMusicMotionBeat * cos(uTime * .83),
        .060 * uEquationMids * sin(uTime * .59)
          + .034 * uMusicMotionMids * cos(uTime * .97)
          + .014 * uMusicMotionHighs * sin(uTime * 1.71)
      );
      equationMu += uMappedEquation * vec2(
        .065 * cos(uTime * .73),
        .052 * sin(uTime * .91)
      );

      mat2 equationFoldRotation = mat2(1.0, 0.0, 0.0, 1.0);
      mat2 equationFoldInverse = mat2(1.0, 0.0, 0.0, 1.0);
      vec2 equationFoldOrigin = vec2(0.0);
      float effectiveEquationFold = 0.0;
      float effectiveEquationWarp = 0.0;
      if (uEquationFolding > .5) {
        float equationFoldPhase = uEquationFoldMotion
          * (uTime * .62 + uMusicClockMids * .12 * uEquationFoldAudio);
        float foldCs = cos(equationFoldPhase);
        float foldSn = sin(equationFoldPhase);
        equationFoldRotation = mat2(foldCs, -foldSn, foldSn, foldCs);
        equationFoldInverse = mat2(foldCs, foldSn, -foldSn, foldCs);
        equationFoldOrigin = uEquationFoldOffset * vec2(
          .30 + .045 * sin(equationFoldPhase * 1.17),
          .21 + .035 * cos(equationFoldPhase * .91)
        );
        // A fold is applied on every recurrence, so a linear UI mapping compounds
        // far too quickly. Perceptual curves keep the lower half useful while the
        // top end still reaches strongly mirrored and warped structures.
        float foldAudioSignal = uEquationFoldAudio
          * (.20 * uEquationBass + .14 * uEquationMids + .06 * uEquationBeat);
        float requestedFold = clamp(uEquationFold + foldAudioSignal * .55, 0.0, 1.0);
        float requestedWarp = clamp(uEquationWarp + foldAudioSignal * .65, 0.0, 1.5);
        effectiveEquationFold = pow(requestedFold, 1.7) * .16;
        effectiveEquationWarp = pow(requestedWarp / 1.5, 1.6) * .48;
      }

      for (int i = 0; i < 2400; i++) {
        if (i >= uIterations) break;
        vec2 baseZ = z;
        if (uEquationFolding > .5) {
          vec2 foldSpace = equationFoldRotation * baseZ;
          vec2 mirroredFold = abs(foldSpace) - equationFoldOrigin;
          foldSpace = mix(foldSpace, mirroredFold, effectiveEquationFold);
          float foldRadius2 = dot(foldSpace, foldSpace);
          vec2 nonlinearWarp = vec2(
            foldSpace.x * foldSpace.x - foldSpace.y * foldSpace.y,
            2.0 * foldSpace.x * foldSpace.y
          ) / (1.0 + foldRadius2);
          foldSpace += nonlinearWarp * effectiveEquationWarp * uEquationWarpScale * .32;
          baseZ = equationFoldInverse * foldSpace;
        }
        if (uFractalType == 3) baseZ = abs(baseZ);
        if (uFractalType == 4) baseZ.y = -baseZ.y;
        if (uFractalType == 10) baseZ = vec2(baseZ.x, -abs(baseZ.y));
        if (uFractalType == 11) baseZ = vec2(abs(baseZ.x), -baseZ.y);
        vec2 z2 = complexMultiply(baseZ, baseZ);
        if (uFractalType == 0) {
          vec2 z4 = complexMultiply(z2, z2);
          z = z4 + complexMultiply(equationMu, z2) + recurrenceC;
        }
        else if (uFractalType == 1) z = z2 + complexMultiply(equationMu, baseZ) * .28 + recurrenceC;
        else if (uFractalType == 2) {
          vec2 z3 = complexMultiply(z2, baseZ);
          z = z3 + complexMultiply(equationMu, z2) * .52 + recurrenceC;
        }
        else if (uFractalType == 3) z = z2 + complexMultiply(equationMu, baseZ) * .18 + recurrenceC;
        else if (uFractalType == 4) z = z2 + complexMultiply(equationMu, baseZ) * .22 + recurrenceC;
        else if (uFractalType == 5) {
          vec2 juliaK = vec2(-.745, .113) * coreCScale + uCoreBias + equationMu * .72;
          z = z2 + juliaK;
        }
        else if (uFractalType == 6) {
          vec2 z4 = complexMultiply(z2, z2);
          vec2 z5 = complexMultiply(z4, baseZ);
          z = z5 + complexMultiply(equationMu, z2) * .36 + recurrenceC;
        }
        else if (uFractalType == 7) {
          vec2 phoenixDistortion = vec2(-.5 + .05 * uEquationBass * uEquation, .035 * uEquationMids * uEquation);
          vec2 nextZ = z2 + recurrenceC
            + complexMultiply(phoenixDistortion, previousZ)
            + equationMu * .12;
          previousZ = baseZ;
          z = nextZ;
        }
        else if (uFractalType == 8) {
          z = vec2(abs(z2.x), z2.y) + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 9) {
          z = abs(z2) + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 10 || uFractalType == 11) {
          z = z2 + recurrenceC + equationMu * .12;
        }
        else if (uFractalType == 12) {
          vec2 magnetC = recurrenceC + equationMu * .12;
          vec2 numerator = z2 + magnetC - vec2(1.0, 0.0);
          vec2 denominator = 2.0 * baseZ + magnetC - vec2(2.0, 0.0);
          vec2 ratio = complexDivide(numerator, denominator);
          z = complexMultiply(ratio, ratio);
        }
        else if (uFractalType == 13) {
          vec2 magnetC = recurrenceC + equationMu * .10;
          vec2 cMinusOne = magnetC - vec2(1.0, 0.0);
          vec2 cMinusTwo = magnetC - vec2(2.0, 0.0);
          vec2 cProduct = complexMultiply(cMinusOne, cMinusTwo);
          vec2 z3 = complexMultiply(z2, baseZ);
          vec2 numerator = z3 + 3.0 * complexMultiply(cMinusOne, baseZ) + cProduct;
          vec2 denominator = 3.0 * z2 + 3.0 * complexMultiply(cMinusTwo, baseZ)
            + cProduct + vec2(1.0, 0.0);
          vec2 ratio = complexDivide(numerator, denominator);
          z = complexMultiply(ratio, ratio);
        }
        else if (uFractalType == 14) {
          vec2 lambda = recurrenceC + equationMu * .18;
          z = complexMultiply(lambda, complexMultiply(baseZ, vec2(1.0, 0.0) - baseZ));
        }
        else if (uFractalType == 15) {
          vec2 nextZ = z2 + previousZ + recurrenceC + equationMu * .10;
          previousZ = baseZ;
          z = nextZ;
        }
        else if (uFractalType == 16) {
          z = z2 + dynamicC + equationMu * .10;
          dynamicC = dynamicC * .5 + z;
        }
        else if (uFractalType == 17 || uFractalType == 18) {
          vec2 z3 = complexMultiply(z2, baseZ);
          vec2 correction = complexDivide(
            z3 - vec2(1.0, 0.0),
            3.0 * z2
          );
          vec2 relaxation = vec2(1.0 + .04 * uEquationBass * uEquation, .025 * uEquationMids * uEquation);
          z = baseZ - complexMultiply(relaxation, correction);
          if (uFractalType == 17) z += recurrenceC + equationMu * .08;
          else z += equationMu * .035;
          if (length(z - baseZ) < .00018) {
            convergenceHit = 1.0;
            escapedAt = i;
          }
        }
        else {
          vec2 z3 = complexMultiply(z2, baseZ);
          z = z3 + recurrenceC + complexMultiply(equationMu, z2) * .18;
        }
        minTrap = min(minTrap, abs(length(z) - (.72 + .06 * uEquationMids + .018 * sin(uTime * 1.7) * uMotion)));
        vec2 trapZ = vec2(dot(z, trapDir), dot(z, vec2(-trapDir.y, trapDir.x)));
        minAxis = min(minAxis, min(abs(trapZ.x), abs(trapZ.y)));
        if (convergenceHit > .5) break;
        if (dot(z, z) > 256.0) {
          escapedAt = i;
          break;
        }
      }

      if (convergenceHit > .5) {
        float rootAngle = atan(z.y, z.x) / 6.2831853 + .5;
        float convergenceBands = rootAngle + float(escapedAt) * (.028 + .008 * uEquationHighs)
          + uTime * uFlow * .018 + frequencyShift;
        float convergenceShade = .32 + .68 * exp(-float(escapedAt) * .026);
        color = palette(convergenceBands) * convergenceShade;
        color += palette(convergenceBands + .28) * (.10 + .16 * uEquationBeat + .10 * uEquationMids) * uMotion;
        color *= .74 + .44 * uRms + .12 * uEquationHighs;
      } else if (escapedAt < uIterations) {
        float smoothingPower = uFractalType == 0 ? 2.0
          : ((uFractalType == 2 || uFractalType == 19) ? 1.5849625
          : (uFractalType == 6 ? 2.3219281 : 1.0));
        float smoothIter = float(escapedAt) + 1.0 - log2(max(1.0, log2(length(z)))) / smoothingPower;
        float flow = uTime * uFlow * (.055 + .018 * uMotion) + uEquationBass * .035 * uMotion;
        float bands = smoothIter * (.035 + .010 * uEquationHighs) + flow + frequencyShift;
        color = palette(bands);
        float shade = .48 + .52 * tanh(smoothIter * .035);
        float boundary = pow(clamp(smoothIter / max(1.0, float(uIterations)), 0.0, 1.0), .32);
        float boundaryPulse = boundary * (.06 + .18 * uEquationBass + .10 * uEquationBeat) * uMotion;
        float trapGlow = exp(-26.0 * minTrap) * (.06 + (.14 + .06 * uMotion) * uEquationBass);
        float axisGlow = exp(-90.0 * minAxis) * (.020 + (.09 + .04 * uMotion) * uEquationHighs);
        color = color * shade + palette(bands + .22) * trapGlow + vec3(.5,.9,1.0) * axisGlow;
        color += palette(bands + .44) * boundaryPulse;
        if (uFractalType == 19) {
          float biomorphEdge = max(
            1.0 - step(10.0, abs(z.x)),
            1.0 - step(10.0, abs(z.y))
          );
          float biomorphOrbit = exp(-.55 * minAxis);
          float biomorph = clamp(.62 * biomorphEdge + .22 * biomorphOrbit, 0.0, .78);
          color = mix(color, palette(bands + .58) * (1.0 + .22 * uEquationHighs), biomorph);
        }
        color *= .76 + .46 * uRms + .14 * uEquationBass + .07 * uEquationBeat;
      } else {
        float radius = length(p);
        float angle = atan(p.y, p.x);
        float wavePhase = radius * (22.0 + 4.0 * uEquationHighs) + angle * 4.0
          - (uTime * 1.05 + uMusicClockMids);
        float bodyWave = pow(.5 + .5 * cos(wavePhase), 5.0);
        float counterWave = pow(.5 + .5 * sin(radius * 13.0 - angle * 4.0
          + uTime * .55 + uMusicClockBass * .55), 7.0);
        float bodyLevel = .012 + .10 * uRms + .045 * uEquationBass + .035 * uEquationBeat;
        float movingSheen = (bodyWave * (.035 + .13 * uEquationMids) + counterWave * .055 * uEquationHighs) * uMotion;
        float interiorTrap = .34 * exp(-15.0 * minTrap) + .14 * exp(-65.0 * minAxis);
        color = palette(.60 + radius * .20 + uTime * .018 + frequencyShift) * (bodyLevel + movingSheen);
        color += palette(.88 + angle * .08 + frequencyShift) * interiorTrap * (.035 + .07 * uEquationBass);
      }
      color *= dimensionalLight;
      color += palette(.18 + dimensionalPoint.z * .22 + frequencyShift) * depthSheen;
      }

      vec2 screenUv = sampleCoord / uResolution.xy;
      vec2 visualPoint = (sampleCoord - .5 * uResolution.xy) / uResolution.y;
      if (uVisualStyle == 1) {
        float style = floor(uBarStyle + .5);
        float warpedX = screenUv.x + sin(screenUv.y * 7.0 - (uTime * 1.1 + uMusicClockMids))
          * .004 * uBarMotion * (.25 + .75 * uMids);
        if (style > 2.5) {
          warpedX += sin(screenUv.x * 18.0 + uTime * 1.1 + uMusicClockHighs) * .009 * uBarMotion;
        }
        warpedX = clamp(warpedX, 0.0, .9999);
        float spectrum = spectrumAt(warpedX);
        float binPhase = fract(warpedX * 64.0);
        float cell = abs(fract(warpedX * 64.0) - .5);
        float columnEdge = clamp(.34 * uBarWidth, .14, .46);
        float column = 1.0 - smoothstep(columnEdge, min(.495, columnEdge + .10), cell);
        float softColumn = 1.0 - smoothstep(columnEdge, min(.5, columnEdge + .24), cell);
        float dance = 1.0 + sin(screenUv.x * 31.0 - (uTime * 1.4 + uMusicClockHighs)) * .10 * uBarMotion;
        vec3 rackColor = palette(screenUv.x * .82 + (uFrequencyHue * uFrequencyColor + uMappedFrequencyHue) * .45 + uTime * .012) * (1.0 + .7 * spectrum);
        vec3 dataColor = palette(screenUv.x * .82 + .23 + frequencyShift);
        float scanGrid = pow(.5 + .5 * cos(screenUv.y * 104.0 + uTime * .09 * uBarMotion), 28.0)
          * (.008 + .04 * uHighs) * uBarGrid;
        color = palette(screenUv.y * .14 + frequencyShift) * (.006 + .042 * uRms + scanGrid);

        if (style < .5) {
          // MAINFRAME CITY: chassis, status LEDs, rooftop beacons, and a reflective machine-room floor.
          float baseline = .115;
          float rackIndex = floor(warpedX * 64.0);
          float idleRack = .14 + .11 * (.5 + .5 * sin(rackIndex * 2.37));
          float barHeight = idleRack + .47 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .012, barTop, screenUv.y));
          float bodySoft = softColumn * smoothstep(baseline - .02, baseline + .006, screenUv.y)
            * (1.0 - smoothstep(barTop, barTop + .055, screenUv.y));
          float rackRow = fract((screenUv.y - baseline) * 48.0);
          float chassis = (1.0 - smoothstep(.35, .48, abs(rackRow - .5))) * body;
          float rackEdge = max(softColumn - column, 0.0) * body;
          float ledNoise = .5 + .5 * sin(floor(warpedX * 64.0) * 17.13
            + floor((screenUv.y - baseline) * 48.0) * 5.71 + uTime * 3.0 + uMusicClockHighs * 8.0);
          float statusLed = step(.88 - .22 * uHighs, ledNoise) * chassis;
          float capGlow = softColumn * exp(-abs(screenUv.y - barTop) * (44.0 + 30.0 * spectrum));
          float localPeakX = (binPhase - .5) / 64.0;
          float beaconPulse = .55 + .45 * sin(uTime * 4.0 + uMusicClockHighs * 7.0 + floor(warpedX * 64.0));
          float beacon = exp(-length(vec2(localPeakX, screenUv.y - barTop - .012)) * 210.0)
            * beaconPulse * (.25 + .75 * spectrum);
          float belowFloor = baseline - screenUv.y;
          float reflectedHeight = .035 + barHeight * .24;
          float reflection = column * step(0.0, belowFloor)
            * (1.0 - smoothstep(reflectedHeight * .86, reflectedHeight, belowFloor));
          float floorMask = 1.0 - smoothstep(.0, baseline, screenUv.y);
          float floorRay = pow(.5 + .5 * cos((screenUv.x - .5) / (belowFloor + .045) * 2.5), 34.0) * floorMask;
          float floorDepth = pow(.5 + .5 * cos(.85 / (belowFloor + .045) - uTime * .18), 40.0) * floorMask;
          color += rackColor * body * (.28 + .34 * uRms);
          color += dataColor * body * .09;
          color += rackColor * chassis * (.28 + .45 * spectrum);
          color += dataColor * statusLed * (1.2 + 1.2 * uHighs);
          color += rackColor * rackEdge * .7;
          color += rackColor * (bodySoft * .07 + capGlow * .17) * uBarGlow;
          color += dataColor * beacon * (1.3 + uBarEcho);
          color += rackColor * reflection * (.08 + .3 * spectrum) * uBarReflection;
          color += dataColor * (floorRay * .035 + floorDepth * .026) * uBarGrid;
          color += dataColor * exp(-abs(screenUv.y - baseline) * 70.0) * (.045 + .10 * uRms);
        } else if (style < 1.5) {
          // DATA CORE: modular neon compute cells with energy rising off every active stack.
          float baseline = .06;
          float barHeight = .07 + .67 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .008, barTop, screenUv.y));
          float segmentPhase = fract((screenUv.y - baseline) * 32.0);
          float segments = smoothstep(.08, .20, segmentPhase) * (1.0 - smoothstep(.78, .92, segmentPhase));
          float segmentedBody = body * segments;
          float core = (1.0 - smoothstep(.06, .19, abs(binPhase - .5))) * body;
          float cap = softColumn * exp(-abs(screenUv.y - barTop) * 64.0);
          float packetPhase = fract(uTime * (.18 + .34 * spectrum) + floor(warpedX * 64.0) * .137);
          float packetY = barTop + .018 + packetPhase * .22;
          float localPacketX = (binPhase - .5) / 64.0;
          float risingPacket = exp(-length(vec2(localPacketX, screenUv.y - packetY)) * 230.0)
            * pow(1.0 - packetPhase, 1.4);
          float energyVeil = softColumn * exp(-abs(screenUv.y - barTop) * 25.0) * (.2 + .8 * spectrum);
          color += rackColor * segmentedBody * (.62 + .7 * uRms);
          color += dataColor * core * (.34 + .75 * spectrum);
          color += rackColor * cap * .23 * uBarGlow;
          color += dataColor * energyVeil * .10 * uBarGlow;
          color += dataColor * risingPacket * (1.2 + 1.4 * uBarEcho);
          color += rackColor * exp(-abs(screenUv.y - baseline) * 92.0) * (.08 + .12 * uBass);
        } else if (style < 2.5) {
          // MIRROR VAULT: a central aisle flanked by synchronized racks and deep perspective guides.
          float horizon = .5;
          float aisleDistance = abs(screenUv.y - horizon);
          float barHeight = .045 + .39 * spectrum * dance;
          float body = column * (1.0 - smoothstep(barHeight - .012, barHeight, aisleDistance));
          float rowPhase = fract(aisleDistance * 47.0);
          float chassis = body * smoothstep(.08, .19, rowPhase) * (1.0 - smoothstep(.74, .9, rowPhase));
          float upperGain = screenUv.y > horizon ? 1.0 : (.28 + .72 * uBarReflection);
          float rackEdge = max(softColumn - column, 0.0) * body;
          float perspectiveRay = pow(.5 + .5 * cos((screenUv.x - .5) / (aisleDistance + .055) * 3.2), 36.0);
          float depthMarker = pow(.5 + .5 * cos(.95 / (aisleDistance + .05) - uTime * .23), 42.0);
          float guideMask = smoothstep(.035, .16, aisleDistance) * (1.0 - smoothstep(.46, .5, aisleDistance));
          float centerBeam = exp(-aisleDistance * 70.0);
          float cap = softColumn * exp(-abs(aisleDistance - barHeight) * 58.0);
          color += rackColor * body * (.28 + .5 * spectrum) * upperGain;
          color += dataColor * chassis * (.34 + .55 * uHighs) * upperGain;
          color += rackColor * rackEdge * .65 * upperGain;
          color += dataColor * (perspectiveRay * .045 + depthMarker * .035) * guideMask * uBarGrid;
          color += dataColor * centerBeam * (.12 + .32 * uRms);
          color += rackColor * cap * .14 * uBarGlow * upperGain;
        } else {
          // PACKET STORM: a moving spectrum skyline carrying chromatic traffic and trailing echoes.
          float baseline = .11 + sin(screenUv.x * 14.0 - (uTime * 1.1 + uMusicClockMids)) * .04 * uBarMotion;
          float barHeight = .065 + .45 * spectrum * dance;
          float barTop = baseline + barHeight;
          float body = column * smoothstep(baseline, baseline + .008, screenUv.y)
            * (1.0 - smoothstep(barTop - .01, barTop, screenUv.y));
          float ribbon = exp(-abs(screenUv.y - barTop) * 82.0);
          float ghostSpectrumA = spectrumAt(clamp(warpedX - .018, 0.0, .9999));
          float ghostSpectrumB = spectrumAt(clamp(warpedX + .018, 0.0, .9999));
          float ghostTopA = baseline + .055 + .43 * ghostSpectrumA;
          float ghostTopB = baseline + .055 + .43 * ghostSpectrumB;
          float ghostA = exp(-abs(screenUv.y - ghostTopA) * 58.0);
          float ghostB = exp(-abs(screenUv.y - ghostTopB) * 58.0);
          float packetGate = pow(.5 + .5 * cos(warpedX * 201.06
            - (uTime * 6.0 + uMusicClockHighs * 12.0)), 42.0);
          float packet = ribbon * packetGate;
          float belowFloor = baseline - screenUv.y;
          float reflection = column * step(0.0, belowFloor)
            * (1.0 - smoothstep(.04 + .16 * barHeight, .05 + .18 * barHeight, belowFloor));
          color += rackColor * body * (.4 + .65 * uRms);
          color += dataColor * ribbon * (.18 + .22 * uBarGlow);
          color += palette(screenUv.x + .45 + frequencyShift) * ghostA * .12 * uBarEcho;
          color += palette(screenUv.x - .2 + frequencyShift) * ghostB * .10 * uBarEcho;
          color += dataColor * packet * (1.1 + 1.7 * uHighs);
          color += rackColor * reflection * (.08 + .3 * spectrum) * uBarReflection;
          color += dataColor * exp(-abs(screenUv.y - baseline) * 62.0) * (.04 + .12 * uBass);
        }
      } else if (uVisualStyle == 2) {
        float radius = length(visualPoint);
        float baseAnglePosition = atan(visualPoint.y, visualPoint.x) / 6.2831853 + .5;
        float angleTwist = sin(radius * (11.0 + 5.0 * uHighs) - (uTime + uMusicClockMids))
          * .018 * uRadialTwist;
        float anglePosition = fract(baseAnglePosition + angleTwist);
        float mirroredPosition = 1.0 - abs(anglePosition * 2.0 - 1.0);
        float spectrum = spectrumAt(mirroredPosition);
        float ringRadius = (.19 + .20 * spectrum) * uRadialSize;
        float spectrumRing = exp(-abs(radius - ringRadius) * (78.0 + 44.0 * uHighs));
        float spectrumHalo = exp(-abs(radius - ringRadius) * (18.0 + 8.0 * spectrum));
        float spokes = pow(.5 + .5 * cos(anglePosition * 6.2831853 * 64.0 + uTime * .35), 10.0) * spectrum;
        vec3 ringColor = palette(mirroredPosition * .92 + (uFrequencyHue * uFrequencyColor + uMappedFrequencyHue) * .5 + uTime * .018);
        float wavePhase1 = fract(uTime * .075 + uMusicClockRms * .035);
        float wavePhase2 = fract(wavePhase1 + .3333);
        float wavePhase3 = fract(wavePhase1 + .6667);
        float outgoing1 = exp(-abs(radius - ringRadius - wavePhase1 * .52) * 46.0) * pow(1.0 - wavePhase1, 1.35);
        float outgoing2 = exp(-abs(radius - ringRadius - wavePhase2 * .52) * 46.0) * pow(1.0 - wavePhase2, 1.35);
        float outgoing3 = exp(-abs(radius - ringRadius - wavePhase3 * .52) * 46.0) * pow(1.0 - wavePhase3, 1.35);
        float outwardFill = step(ringRadius, radius) * exp(-(radius - ringRadius) * 5.5) * (.12 + .45 * spectrum);
        float orbitShimmer = exp(-abs(radius - ringRadius - .035 * sin(anglePosition * 25.1327 + uTime)) * 34.0)
          * (.12 + .38 * uMids) * uRadialTwist;
        color = palette(radius * .32 - uTime * .009 + frequencyShift)
          * (.008 + (.06 * uRms + outwardFill * .18) * uRadialAtmosphere);
        color += ringColor * spectrumRing * (1.0 + .78 * spectrum);
        color += ringColor * spectrumHalo * (.045 + .18 * spectrum) * uRadialGlow;
        color += ringColor * (outgoing1 + outgoing2 + outgoing3)
          * (.18 + .82 * spectrum + .35 * uBeat) * uRadialWaves;
        color += ringColor * spokes * exp(-abs(radius - ringRadius) * 18.0) * .20 * uRadialSpokes;
        color += palette(mirroredPosition + .28 + frequencyShift) * orbitShimmer * .12;
      } else if (uVisualStyle == 3) {
        float radius = length(visualPoint) / max(.5, uPulseSize);
        float angle = atan(visualPoint.y, visualPoint.x);
        float phase1 = fract(uTime * .082);
        float phase2 = fract(uTime * .069 + .34);
        float phase3 = fract(uTime * .057 + .68);
        float lowJagged = jaggedProfile(angle, uTime, 11.0, 19.0, 31.0)
          * uPulseJagged * (.0015 + .034 * uBass + .018 * uBeat);
        float midJagged = jaggedProfile(angle, uTime * 1.08, 23.0, 41.0, 67.0)
          * uPulseJagged * (.0012 + .027 * uMids);
        float highJagged = jaggedProfile(angle, uTime * 1.22, 37.0, 73.0, 109.0)
          * uPulseJagged * (.0010 + .022 * uHighs);
        float lowRadius = radius - lowJagged;
        float midRadius = radius - midJagged;
        float highRadius = radius - highJagged;
        float ring1 = expandingWave(lowRadius, phase1, 74.0 + 42.0 * uBass, 0.0);
        float ring2 = expandingWave(midRadius, phase2, 68.0 + 38.0 * uMids, 1.0);
        float ring3 = expandingWave(highRadius, phase3, 62.0 + 42.0 * uHighs, 2.0);
        float lowTrail = sourceRingTrail(lowRadius, phase1, .032, 0.0) * uPulseTrail;
        float midTrail = sourceRingTrail(midRadius, phase2, .029, 1.0) * uPulseTrail;
        float highTrail = sourceRingTrail(highRadius, phase3, .026, 2.0) * uPulseTrail;
        vec3 emittedMusicWaves = musicEmittedWaves(radius, angle);
        float rays = pow(.5 + .5 * cos(angle * (8.0 + floor(uMids * 8.0))
          - (uTime * .7 + uMusicClockHighs)), 14.0);
        float radialTexture = pow(.5 + .5 * cos(radius * (145.0 + 28.0 * uHighs)
          - (uTime * 1.1 + uMusicClockMids)), 11.0);
        float centerGlow = exp(-radius * (7.2 - 1.2 * uBass));
        float wakeEnvelope = exp(-radius * 3.8);
        float wake = wakeEnvelope * (.018 + .075 * uRms)
          + radialTexture * wakeEnvelope * (.025 + .16 * uRms + .08 * uBeat)
          + rays * exp(-radius * 2.8) * (.018 + .075 * uHighs);
        vec3 backgroundLayer = palette(radius * .55 - uTime * .018 + frequencyShift) * (.008 + wake);

        // Middle layer: music waves remain behind the emitter and emerge beyond its outer lane.
        float emitterOcclusion = 1.0 - smoothstep(.19, .285, radius);
        vec3 waveLayer = backgroundLayer + emittedMusicWaves * (1.0 - emitterOcclusion);
        waveLayer = waveLayer / (1.0 + waveLayer * .45);

        // Foreground layer: source lanes, local trails, and center glow always composite last.
        vec3 emitterLayer = vec3(0.0);
        emitterLayer += palette(.08 + frequencyShift) * ring1 * (.30 + .70 * uBass + .40 * uBeat);
        emitterLayer += palette(.43 + frequencyShift) * ring2 * (.28 + .68 * uMids);
        emitterLayer += palette(.78 + frequencyShift) * ring3 * (.25 + .62 * uHighs);
        emitterLayer += palette(.08 + frequencyShift) * lowTrail * (.06 + .31 * uBass + .18 * uBeat);
        emitterLayer += palette(.43 + frequencyShift) * midTrail * (.055 + .27 * uMids);
        emitterLayer += palette(.78 + frequencyShift) * highTrail * (.05 + .24 * uHighs);
        emitterLayer += palette(.62 + frequencyShift) * centerGlow
          * (.025 + .11 * uRms + .07 * uBeat)
          * (.28 + .72 * radialTexture);
        emitterLayer = emitterLayer / (1.0 + emitterLayer * .30);
        float emitterCoverage = clamp(
          max(max(ring1, ring2), ring3) * .82
          + (lowTrail + midTrail + highTrail) * .22
          + centerGlow * .32,
          0.0, 1.0
        );
        color = waveLayer * (1.0 - emitterCoverage * .78) + emitterLayer;
        color = color / (1.0 + color * .18);
      } else if (uVisualStyle == 4) {
        float wave = waveformAt(screenUv.x);
        float centeredY = screenUv.y - .5;
        float amplitude = (.10 + .18 * uMotion) * (1.0 + .35 * uRms);
        float mainLine = exp(-abs(centeredY - wave * amplitude) * 190.0);
        float upperEcho = exp(-abs(centeredY - .19 - wave * amplitude * .62) * 105.0);
        float lowerEcho = exp(-abs(centeredY + .19 - wave * amplitude * .62) * 105.0);
        float fineGrid = pow(.5 + .5 * cos(screenUv.y * 95.0 + uTime * .16), 18.0) * (.025 + .10 * uHighs);
        vec3 waveColor = palette(screenUv.x * .92 + (uFrequencyHue * uFrequencyColor + uMappedFrequencyHue) * .55 + uTime * .014);
        color = palette(screenUv.y * .25 + uTime * .008 + frequencyShift) * (.012 + .065 * uRms + fineGrid);
        color += waveColor * mainLine * (.72 + .7 * uRms + .5 * uBeat);
        color += palette(screenUv.x + .32 + frequencyShift) * upperEcho * (.18 + .55 * uMids);
        color += palette(screenUv.x + .68 + frequencyShift) * lowerEcho * (.18 + .55 * uBass);
      } else if (uVisualStyle == 5) {
        color = renderMandelbulb(visualPoint * 2.0, frequencyShift);
      } else if (uVisualStyle == 6) {
        color = renderMainframeLandscape(screenUv, frequencyShift);
      }

      float vignette = 1.0 - .48 * dot(p, p);
      color *= clamp(vignette, .35, 1.0);
      color = pow(max(color, 0.0), vec3(.84));
      float grain = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898,78.233))) * 43758.5453);
      color += (grain - .5) * (uExporting > .5 ? 0.0 : 1.0 / 255.0);
      float chromaLuminance = dot(max(color, 0.0), vec3(.2126, .7152, .0722));
      if (uChromaKey > .5) {
        if (chromaLuminance < uChromaThreshold) {
          color = vec3(0.0, 1.0, 0.0);
        } else {
          // Reserve green exclusively for the key background. Bright subject pixels
          // are pushed toward magenta/blue and then hard-limited outside OBS's green hue.
          float greenLead = color.g - max(color.r, color.b);
          float greenMask = smoothstep(-.035, .10, greenLead) * smoothstep(.045, .22, color.g);
          vec3 chromaSafe = vec3(color.r + color.g * .52, color.g * .04, color.b + color.g * .66);
          color = mix(color, chromaSafe, greenMask);
          color.g = min(color.g, max(color.r, color.b) * .62);
        }
      }
      if (uHdrExport > .5) color = encodeRec2020Hlg(color);
      fragColor = vec4(color, 1.0);
    }
  `;


  window.QuarticShaderSource = Object.freeze({
    vertex: vertexSource,
    fragment: fragmentSource
  });
})();
