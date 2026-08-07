# Quartic Pulse

See [CHANGELOG.md](CHANGELOG.md) for release-by-release additions, changes, fixes, and packaging notes.

Quartic Pulse is a Windows 11 music visualizer and music-to-video exporter built around an audio-reactive family of escape-time fractals. Its signature mode is the power-4 Mandelbrot set:

```text
z₀ = 0
zₙ₊₁ = zₙ⁴ + c
```

With equation modulation enabled, the music introduces a bounded quadratic term:

```text
zₙ₊₁ = zₙ⁴ + μ(t)zₙ² + c
```

Bass and beats drive the real component of `μ`, mids drive its imaginary component, and silence returns `μ` to zero—the exact quartic Mandelbrot equation. Because the renderer already computes `z²` while calculating `z⁴`, this geometric transformation adds little cost compared with changing to a non-integer exponent.

It uses WebGL2 for GPU rendering, the Web Audio API for live frequency analysis, a deterministic FFT analyzer for offline export, Electron for the Windows desktop shell, WebCodecs for frame encoding, and FFmpeg for final audio/video muxing.

![Quartic Pulse interface](quartic-pulse-preview.png)

## v0.28.3 live-production refinements

- Export preflight now verifies the final encoder, estimates output and temporary-master storage, checks free disk space again at the chosen destination, and offers a five-second test render before committing to a full song.
- Final H.264 encoding automatically prefers a verified NVIDIA NVENC path, then Intel Quick Sync or AMD AMF when available. CPU x264 remains the universal quality fallback and is retried automatically if a hardware encoder fails.
- Installer and portable releases carry their own FFmpeg executable and license notice, so exporting does not depend on FFmpeg being installed separately on the destination Windows 11 PC.
- Offline rendering shows elapsed time and an adaptive ETA, supports Pause/Resume between exact frames, confirms destructive cancellation, and keeps End & Finish for producing a valid shortened video.
- Interrupted offline jobs retain recoverable frame data and appear under Recoverable Exports on the next launch. Completed exports have a local history with encoder, dimensions, size, Open, and Folder actions.
- Quartic Pulse autosaves the current visual session and last local song every ten seconds, restores sessions for up to 30 days, and reopens the previous play position when that file is still available.
- Saved profiles and the 20-equation library now include search and favorites. A live Visual Safety Estimate labels the current combination Calm, Active, or Intense based on motion, color, equation deformation, folding, beat response, and measured audio energy.
- Beat detection now uses a dedicated, lightly smoothed 30â€“520 Hz onset analyzer with a fast envelope, adaptive baseline, and cooldown. It remains responsive even when the main visual analyzer uses heavy smoothing.
- Beat Sensitivity and Beat Cooldown controls are available in Reactivity > Advanced and are included in full saved profiles.
- Chroma-safe green screen mode reserves pure green for the keyed background and shifts green-dominant subject colors away from the OBS key range.
- The frameless OBS output can be repositioned by dragging the transparent strip along its top edge, and changing its output settings no longer recenters it.
- Export progress now separates frame rendering, encoder flushing, final encoding/muxing, and destination saving. Frame rendering stops at 80%, the completed encoder flush reaches 85%, and 100% is reserved for a successfully closed final file, with OneDrive destinations identified in the status.
- An optional completion stinger sounds only after an exported video has been fully saved; the preference is available in the Export tab.
- Offline exports use a high-bitrate quality master tied to Export Detail, prefer the stable software VP9 path, and finish MP4/MOV/MKV at H.264 CRF 14 to preserve dense, fast-moving fractal detail.
- The centered export-status card remains visible during both Offline and Live exports, including when the visual preview stays enabled, with mode-specific rendering and saving messages.
- Export status provides separate **End & Finish** and **Cancel Export** actions. End & Finish saves a shortened valid video at the current point; Cancel discards the active job and its temporary output.
- Export progress is mode-locked: Offline muxing/finalization can no longer be overwritten by Live recording progress from the deck-time UI updater.
- Custom palette fields use the descriptive roles Shadow Color, Field Color, Accent Color, and Detail Color while preserving existing HEX/RGB data and profile compatibility.

## Run in Visual Studio Code

1. Install [Node.js LTS](https://nodejs.org/) and open this folder in VS Code.
2. Open the integrated terminal (`Ctrl` + `` ` ``).
3. Install dependencies:

   ```powershell
   npm install
   ```

   Release packaging also requires a 64-bit Windows FFmpeg build on PATH. `npm run dist` automatically runs `npm run bundle:ffmpeg`, copies FFmpeg and its license notice into the packaged application, and keeps the large executable out of the Git repository.

4. Start the app:

   ```powershell
   npm start
   ```

You can also press `F5` and choose **Run Quartic Pulse**. The included `.vscode/launch.json` starts Electron with DevTools open.

## Using the visualizer

- Click **Load Audio** or drag an audio file onto the visualizer.
- Under **Windows Audio Source**, choose any Windows playback endpoint captured directly through WASAPI loopback, including separate SteelSeries Sonar Gaming, Chat, Media, Stream, and Aux channels. Microphones, line-in, and virtual recording inputs remain available in their own group. **Refresh Devices** rescans both kinds of endpoint and requests permission for friendly input names. Live sources drive the analyzer without being played back through the app, preventing echo and microphone feedback.
- Open **Music → Playlist** to add multiple local files, import a local music folder, reorder the queue, or move between songs.
- Press **Space** to play or pause.
- Use the Music tab to skip by ten seconds, restart, mute the monitor, change listening volume or playback speed, and loop a track.
- Enable **Color by frequency** to move through the selected preset or custom palette according to the dominant bass, mid, or high-frequency energy.
- Every numerical slider includes an editable number box, a **?** tip button, and a **↺** reset button. Dropdowns, switches, palettes, and custom colors also include reset controls.
- Drag the fractal to pan and use the mouse wheel to zoom.
- Press **R** to reset the view.
- Choose from 20 named 2D equations in the Fractal Equation menu, including Mandelbrot and Multibrot powers, Julia, Burning Ship variants, Phoenix, Magnet, Lambda, Newton, Nova, and Pickover Biomorph. The power-4 Mandelbulb remains available as the separate true-3D visual.
- Choose **Fractal**, the true ray-marched **3D Mandelbulb**, or a conventional **Spectrum Bars**, **Radial Spectrum**, **Pulse Rings**, or **Waveform Field** presentation from the Visuals menu. Appearance shows only the controls and presets that apply to the selected style. Conventional modes skip fractal iteration for lower GPU cost; every style uses the active palette and music analysis and is rendered into exported videos.
- **3D Mandelbulb** uses a distance-estimated power-4 recurrence and GPU ray marching to produce genuine surface depth, perspective, lighting, and camera orbit. Drag the canvas to orbit, use the mouse wheel for camera distance, and start from Quartic Core, Deep Orbit, Storm Fold, or Neon Shell. Bass and beats alter power and camera breathing, mids drive folding and orbit, and highs sharpen surface light. Adaptive mode scales live resolution and ray steps; offline export and Unleashed mode use a higher step budget.
- Fractal equations use a separate compressed audio envelope with adjustable **Equation Smoothing**. The 90% default slows topology changes and suppresses beat-to-beat strobing without making Spectrum Bars, Pulse Rings, or the music meters less responsive. Equation Modulation now defaults to 6% and remains adjustable in Advanced Reactivity.
- **Basic mode** now leads with visual preview cards, Low Flash/Balanced/Expressive response presets, equation-aware starting points, four ready-made palettes, and larger quick controls. **Advanced mode** retains the complete equation, modulation, custom-palette, profile, dimensional, folding, and performance toolset.
- A first-run visual-safety notice explains possible flashing, contrast, and motion effects. **Low Flash** disables beat scaling and GPU-intensive folding/depth features while substantially reducing color movement, camera motion, pulse density, and equation deformation.
- **Appearance navigation** uses Overview, Reactivity, Dimension, and Folding subtabs. Overview keeps visual selection, palettes, the two GPU-intensive feature toggles, and safe core-equation editing. The other subtabs keep presets visible while fine tuning remains collapsed under Advanced Settings.
- **Fractal Dimensional Rotation** is an optional GPU-intensive mode that is off by default. When enabled from Appearance Overview, its dedicated Dimension subtab rotates the complex sampling plane through virtual depth, applies perspective, moves through a changing depth slice, and adds depth lighting. Dimensional, Classic, Deep Orbit, and Dream Fold presets provide starting points.
- **Equation Fold & Warp** is a separate optional GPU-intensive mode that is off by default. When enabled from Appearance Overview, its dedicated Folding subtab folds and nonlinearly warps the complex value inside every recurrence step. Soft Fold, Kaleidoscope, Liquid Equation, and Static Mirror presets provide starting points. Because these transforms compound across iterations, v0.28 uses perceptual response curves instead of sending the UI percentage into every recurrence linearly. Low and middle settings now retain the original fractal while Music Fold adds smoothed movement; the upper range still reaches strongly mirrored structures. The nonlinear warp remains bounded to prevent unstable coordinate growth.
- **Core equation editing** exposes the recurrence constant's influence plus real and imaginary bias. These fields modify Mandelbrot-family `c` values and the Julia constant directly without accepting unreliable free-form shader code. A 50% influence with zero bias preserves the selected equation's original form.
- Appearance and reactivity intensity controls use normalized 0â€“100% input scales. Directional controls and equation biases use centered âˆ’50% to +50% scales. Domain-specific values such as frequency boundaries, zoom magnification, and iteration counts retain Hz, magnification, and iteration units.
- **Spectrum Bars** includes Balanced, Neon, Mirror Hall, and Wave Dance presets. Basic controls adjust bar width, neon glow, and top-edge reflection; Advanced controls add music-driven motion warp, animated peak echoes, and grid intensity.
- **Radial Spectrum** includes Balanced, Halo, Starburst, and Orbit Echo presets. Basic controls adjust ring size, halo glow, and fading wave echoes; Advanced controls add angular twist, spoke intensity, and the surrounding color atmosphere. Its frequency mapping remains mirrored for a continuous circle.
- **Pulse Rings** uses an explicit three-layer composition: radial texture in back, music-emitted waves in the middle, and the compact three-lane center emitter in front. Emitted waves are masked beneath the emitter, emerge beyond its outside edge, and dissolve with distance and age. Simultaneous low, mid, and high attacks are combined into one strongest musical event, and each accepted event emits one ring. **Pulse Density** controls transient sensitivity, the shared creation delay, and a small active-ring budget; at the 75% Balanced default it permits at most three traveling event rings. **Ring Size** controls the full composition scale, and **Creation Cooldown** lengthens or shortens the shared delay between accepted events. The expandable Advanced section contains **Pulse Jaggedness**, **Pulse Trails**, and **Pulse Detail** for frequency-shaped edges, inward fading wakes, sharp echo ridges, and fine concentric structure.
- Drag the glowing edge on the left side of the settings panel to resize it. The controls scale with the panel, and the chosen width is remembered. Double-click the edge to restore the default width.
- Open **Stream → OBS Studio** to launch a clean, borderless **Quartic Pulse — OBS Output** window at 720p, 1080p, 1440p, or 4K. Add that window to OBS as a Window Capture source while keeping the main Quartic Pulse controls open. The output mirrors the selected visual, palette, equation settings, and live music analysis at a 30 or 60 FPS synchronization rate.
- **Green-screen background** replaces dark output pixels with pure chroma green without changing the main preview. Adjust **Key Threshold** to preserve or remove darker visual detail, then add OBS's Chroma Key filter to the Window Capture source. Stream audio remains configured separately in OBS to prevent duplicate or delayed sound.
- Open **Appearance → Saved Profiles** to store named configurations on the current PC. **Color Palette** profiles contain the active preset/custom colors and frequency-color behavior; **Full Visual Settings** profiles additionally contain the selected visual or fractal equation, camera location, reactivity, frequency bands, dimensional and folding controls, conventional effects, pulse settings, and export/stream preferences. Saving the same name and type updates that profile.
- Saved profiles can be exported as readable `.quartic-pulse.json` files and imported on another Quartic Pulse installation. Imported files are schema-checked before being stored or applied.
- **Appearance → Mapping** contains the Audio Modulation Matrix. Up to eight routes can connect Bass, Mids, Highs, Beat, or Overall Level to Equation Modulation, Equation Fold/Warp, Dimensional Tilt/Slice, Camera Zoom, Rotation, Color Position/Flow, Visual Motion, or Pulse Jaggedness. Each route provides signed amount, attack and release speed, an input floor and ceiling, live activity metering, enable/bypass, manual numerical entry, and reset controls.
- Math Drive, Deep Motion, and Conventional modulation presets provide safe starting points. Rotation routes drive angular velocity rather than directly replacing the current angle, so a Beat source creates a brief smooth acceleration instead of a jarring whole-frame rotation jump. Matrix routes are saved locally, included in Full Visual Settings profiles, synchronized with the OBS output window, and applied during deterministic offline or Unleashed live export without changing their underlying base controls.
- Adjust detail, palette, flow, reactivity, motion, rotation, beat pulse, and automatic drift from the right panel.
- Use **Equation Modulation** to control how strongly the music changes the fractal geometry itself. Set it to zero for the original equation.
- Choose a resolution from 480p through 4K and a frame rate from 30 through 120 FPS, then click **Export Video**. Offline mode is the default: it decodes the song, calculates audio data at every exact frame timestamp, waits for each GPU frame to finish, encodes it, and combines the original audio afterward. Slower computers take longer instead of silently dropping requested frames.

Settings are organized into seven top-level tabs:

- **Music** contains **Deck**, **Playlist**, and **Frequency Color** subtabs. Together they provide local audio import and playback controls, endpoint-specific Windows WASAPI output capture, recording-input capture, multi-file and folder queues, and frequency-driven palette controls. Network audio links and radio streams are intentionally unsupported. Live Windows sources visualize in real time but cannot use the song-to-video exporter because they have no fixed duration.
- **Appearance** contains **Overview**, **Reactivity**, **Dimension**, **Folding**, and **Mapping** subtabs. Together they provide visual presets, palettes, the four-stop custom palette editor, core-equation controls, music response, dimensional sampling, equation-level folding, and the audio modulation matrix.
- **Live** contains **Show**, **Controls**, **Camera**, and **Tools** subtabs. It provides beat-synchronized profile sequencing, MIDI Learn, focused keyboard mappings, OSC control, saved camera paths, reversible visual randomization, quick capture, now-playing presentation, and the Performance Assistant.
- **Stream** creates and configures the visual-only OBS output window, including its resolution, synchronization rate, always-on-top behavior, optional chroma-key background, and OBS WebSocket automation.
- **Export** contains base iterations, resolution, frame rate, video format, export detail, performance guidance, and recording controls.
- **System** contains hardware detection, adaptive quality, performance presets, live frame protection, and the optional Unleashed mode.
- **About** contains project, Tempest Mainframe, licensing, and branding information.

The custom palette editor accepts a native color picker, six-digit HEX values, or individual 0–255 RGB values. All three input formats stay synchronized.

The **About** tab identifies Tempest Mainframe as the creator and maintainer, displays the Storm Horizon Media branding, summarizes the rendering stack, and explains the GPL-3.0-or-later source-code license.

The application icon is a fractal interpretation of the Storm Horizon symbol. Its source master is stored in `assets/quartic-pulse-fractal-logo-master.png`; the Windows build and development window use `assets/icon.png`.

The analyzer maps approximately 25–180 Hz to bass, 180–2,400 Hz to mids, and 2,400–12,000 Hz to highs. Those bands drive breathing zoom, camera orbit, rotation, moving orbit traps, color flow, luminance, and a bounded equation term tailored to the selected fractal. Frequency color computes a smoothed spectral position from those same bands: bass selects the low end of the active palette, mids the center, and highs the upper end.

Frequency bands offer **Basic** and **Advanced** modes. Basic uses the recommended 25 Hz, 180 Hz, 2,400 Hz, and 12,000 Hz boundaries. Advanced lets the user edit the analysis floor, low/mid split, mid/high split, and analysis ceiling with sliders or numerical entry. Quartic Pulse keeps these boundaries ordered and continuous automatically, preventing gaps and overlaps while applying the custom bands to meters, frequency color, beat detection, motion, and equation modulation.

**Auto reactivity** keeps the same dB-based frequency analysis while automatically adjusting its gain toward a 74% peak target. It turns loud tracks down quickly and raises quiet tracks gradually, with a 96% safety ceiling so the meters and visuals do not remain pinned at 100%. The Reactivity slider remains the base sensitivity; turn Auto reactivity off for fully manual gain.

The main fractal body carries the strongest response: bass and beats drive its breathing and boundary flash, mids move waves through its interior, and highs add a finer counter-wave. Orbit-trap lines retain a quieter treble shimmer so they support rather than overpower the quartic body.

Export detail is independent from live detail. **Enhanced** uses 1.6× the base iteration count and **Ultra** uses 2.3×, up to the standard 1,200-iteration safety ceiling. Unleashed mode adds a 3.5× choice and raises the absolute shader ceiling to 2,400 iterations.

**Adaptive live quality** watches frame time and can reduce only the live render scale to 62% when necessary. It gradually restores full resolution when the GPU has headroom. Export resolution and export iteration detail are never reduced by this setting.

The export tab disables the onscreen preview by default while recording. The WebGL canvas continues producing every video frame, but Electron avoids displaying that canvas and the interface updates only ten times per second, reducing composition and UI overhead. Enable **Show preview while exporting** when monitoring is more important than the small resource saving.

## Live performance and stream control

- The **Show Sequencer** arranges saved profiles into a performance. Entries can advance after a chosen number of beats or seconds, cut immediately, or fade through black. Automatic BPM detection, tap tempo, manual BPM, beat offset, looping, and shuffle are included.
- **OBS Automation** connects only to OBS WebSocket on `127.0.0.1`. Its password remains in memory and is never saved. It can switch scenes, show or hide scene sources, create a Window Capture input, and apply a linked Quartic Pulse profile whenever the OBS program scene changes.
- **Live Controls** stores up to 40 mappings. MIDI Note and Control Change messages support learn mode and continuous visual values. Keyboard mappings work while Quartic Pulse is focused. The OSC UDP server listens only on localhost by default; LAN listening requires the explicit **Allow LAN controllers** switch.
- **Camera Paths** save exact center and zoom bookmarks, interpolate between two views with Linear, Smooth, or Cinematic easing, and can loop back and forth. Slow Orbit, Deep Drift, and Zoom Breath provide bookmark-free motion.
- The **Safe Randomizer** offers Gentle, Bold, and Chaos variations with separate locks for visual type, equation, colors, motion, reactivity, and camera. One-step undo restores the exact pre-randomized visual settings.
- **Quick Capture** saves the current WebGL canvas as PNG or records a 5, 10, or 15 second MP4 clip through the existing streaming export pipeline. The full Export tab remains the correct choice for full-song, high-detail output.
- The **Now Playing** card can use the loaded filename or custom title and artist text. It appears in the main stage and OBS output window at any corner without changing the underlying fractal.
- The **Performance Assistant** measures an eight-second frame-time sample, reports typical FPS and 95th-percentile frame time, recommends a safe live iteration count, and can disable simultaneous heavy equation effects when necessary. Average PC, Balanced, and Showcase presets are also available. Adaptive protection changes only live render scale; export detail remains independent.
- Quartic Pulse reads local CPU thread count, installed RAM, active GPU information, driver feature status, and reported video memory where the driver exposes it. Automatic mode combines those facts with the optional live benchmark to recommend Efficient, Balanced, or Performance settings. Hardware discovery is advisory and never locks the user out of a visual.
- **Unleashed mode** is an explicit Advanced Performance switch. It raises the live base-iteration limit from 500 to 800, raises the shader/export ceiling from 1,200 to 2,400, unlocks 3.5× export detail, and enables the legacy wall-clock Live export engine. Absolute limits remain in place.

## Advanced GPU output boundary

The built-in OBS output uses a borderless visual-only window and works without native plugins. Quartic Pulse also detects an optional native sender at `assets/spout/QuarticPulse.SpoutSender.exe`, but it does not claim to implement Spout2 in JavaScript. True Spout2 output requires all of the following:

1. A compiled 64-bit Direct3D texture-sharing sender linked against the Spout2 SDK.
2. A narrow, audited native bridge that receives Quartic Pulse frames without exposing Node.js to the renderer.
3. Code signing for the native executable so Windows 11 distribution does not introduce another untrusted binary.
4. The matching OBS Spout2 source plugin on the streaming PC.

Until that signed native add-on is supplied, **OBS Window Capture** is the supported low-setup path. The Stream tab reports this capability honestly and will detect the optional sender file if it is added later.

## Video formats

- Default offline export encodes exact VP9 or VP8 video frames with WebCodecs and uses FFmpeg to combine them with the original selected audio file.
- **MP4**, **MOV**, and **MKV** offline exports use H.264/AAC for broad compatibility.
- **WebM** offline export keeps the VP9/VP8 video stream and uses Opus audio.
- The Unleashed-only Live engine keeps the previous MediaRecorder workflow and preserves a WebM fallback if later MP4/MOV/MKV conversion fails.
- Quartic Pulse verifies that FFmpeg can start before offline frame rendering begins. If final muxing later fails, the completed video stream is preserved as `.video-only.ivf` instead of discarding hours of work.

Install FFmpeg on Windows with:

```powershell
winget install Gyan.FFmpeg
```

Restart VS Code after installing so its terminal inherits the updated `PATH`.

## Build for Windows

Create an unpacked test build:

```powershell
npm run pack
```

Create an NSIS installer and a portable executable:

```powershell
npm run dist
```

Build output is written to `release/`.

The normal Windows installer uses a branded Quartic Pulse assisted setup flow. It requests administrator approval for an all-users installation, displays the installation-folder page with a **Browse** button, and shows the selected path again before the user chooses **Install**. The portable executable remains available for users who do not want an installed copy.

## License and branding

Quartic Pulse is free software licensed under the [GNU General Public License, version 3 or later](LICENSE). You may use, study, modify, and share it. If you distribute Quartic Pulse or a modified version, you must preserve the same freedoms, license the complete covered work under GPL-3.0-or-later, and provide the corresponding source as required by the license.

The Storm Horizon Media name, logo, and associated branding are not licensed under the GPL; see [BRAND_ASSETS.md](BRAND_ASSETS.md). Modified releases may use replacement branding. Copies previously received under the MIT License remain available under those existing terms; this license change governs this revision and future releases.

## Project layout

```text
src/main/main.js       Electron window, save dialogs, streaming export, FFmpeg
src/main/preload.js    Narrow secure bridge between UI and Windows functionality
src/renderer/app.js    WebGL2 shader, audio analyzer, playback, recording
src/windows-audio/     WASAPI playback-endpoint capture helper source
src/renderer/index.html
src/renderer/styles.css
```

## Current scope

Offline export is deterministic but intentionally bounded by the selected song length, resolution, FPS, shader detail, WebCodecs support, available memory, and FFmpeg. High-detail output may render slower than the song duration, which is expected. Live Windows capture sources still cannot use offline export because they have no fixed local audio file. Code signing is also required before distributing a warning-free installer broadly.
