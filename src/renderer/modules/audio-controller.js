(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const audio = options.audio;
    const formatTime = options.formatTime || ((value) => String(value || 0));
    const getState = options.getState || (() => ({}));
    const reportError = options.reportError || ((error) => console.error(error));
    const timeline = query('#timeline');
    let timelinePointerId = null;
    let bound = false;

    function canSeek() {
      return Boolean(audio && Number.isFinite(audio.duration) && audio.duration > 0 && !getState().exporting);
    }

    function renderTimeline(position, duration) {
      const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
      const safePosition = safeDuration ? Math.max(0, Math.min(safeDuration, Number(position) || 0)) : 0;
      const progress = safeDuration ? safePosition / safeDuration : 0;
      const fill = query('#timelineFill');
      const readout = query('#timeReadout');
      if (fill) fill.style.width = `${Math.min(100, progress * 100)}%`;
      if (readout) readout.textContent = `${formatTime(safePosition)} / ${formatTime(safeDuration)}`;
      if (timeline) {
        timeline.setAttribute('aria-valuemax', String(Math.round(safeDuration)));
        timeline.setAttribute('aria-valuenow', String(Math.round(safePosition)));
        timeline.setAttribute('aria-valuetext', `${formatTime(safePosition)} of ${formatTime(safeDuration)}`);
      }
      return progress;
    }

    function seekFromPointer(event) {
      if (!canSeek() || !timeline) return;
      const rect = timeline.getBoundingClientRect();
      if (rect.width <= 0) return;
      const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      audio.currentTime = progress * audio.duration;
      renderTimeline(audio.currentTime, audio.duration);
      options.onSeek?.(audio.currentTime);
    }

    function finishScrub(event) {
      if (timelinePointerId !== event.pointerId || !timeline) return;
      if (event.type === 'pointerup') seekFromPointer(event);
      if (timeline.hasPointerCapture(event.pointerId)) timeline.releasePointerCapture(event.pointerId);
      timelinePointerId = null;
      timeline.classList.remove('scrubbing');
    }

    function bindTimeline() {
      if (!timeline) return;
      timeline.addEventListener('pointerdown', (event) => {
        if ((event.pointerType === 'mouse' && event.button !== 0) || !canSeek()) return;
        event.preventDefault();
        timelinePointerId = event.pointerId;
        timeline.setPointerCapture(event.pointerId);
        timeline.classList.add('scrubbing');
        seekFromPointer(event);
      });
      timeline.addEventListener('pointermove', (event) => {
        if (timelinePointerId === event.pointerId) seekFromPointer(event);
      });
      timeline.addEventListener('pointerup', finishScrub);
      timeline.addEventListener('pointercancel', finishScrub);
      timeline.addEventListener('lostpointercapture', (event) => {
        if (timelinePointerId !== event.pointerId) return;
        timelinePointerId = null;
        timeline.classList.remove('scrubbing');
      });
      timeline.addEventListener('keydown', (event) => {
        if (!canSeek()) return;
        const seekAmount = event.shiftKey ? 15 : 5;
        let target = audio.currentTime;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target -= seekAmount;
        else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target += seekAmount;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = audio.duration;
        else return;
        event.preventDefault();
        audio.currentTime = Math.max(0, Math.min(audio.duration, target));
        renderTimeline(audio.currentTime, audio.duration);
        options.onSeek?.(audio.currentTime);
      });
    }

    function bindTransport() {
      query('#playButton')?.addEventListener('click', () => Promise.resolve(options.onTogglePlayback?.()).catch(reportError));
      query('#restartButton')?.addEventListener('click', () => options.onRestart?.());
      query('#skipBackButton')?.addEventListener('click', () => options.onSkip?.(-10));
      query('#skipForwardButton')?.addEventListener('click', () => options.onSkip?.(10));
      query('#volume')?.addEventListener('input', (event) => options.onVolume?.(Number(event.target.value)));
      query('#muteButton')?.addEventListener('click', () => options.onMute?.());
      query('#playbackRate')?.addEventListener('change', (event) => options.onPlaybackRate?.(Number(event.target.value)));
      query('#loopPlayback')?.addEventListener('change', (event) => options.onLoop?.(event.target.checked));
    }

    function bind() {
      if (bound) return;
      bindTransport();
      bindTimeline();
      bound = true;
    }

    function renderTransport(view = {}) {
      document.body.classList.toggle('playing', Boolean(view.playing));
      const icon = query('#playIcon');
      const button = query('#playButton');
      if (icon) icon.textContent = view.deckPlaying ? 'Ⅱ' : '▶';
      if (button) button.setAttribute('aria-label', view.deckPlaying ? 'Pause' : 'Play');
      if (!view.exporting) {
        const dot = query('#liveDot');
        const label = query('#liveLabel');
        if (dot) dot.className = `live-dot${view.playing ? ' playing' : ''}`;
        if (label) label.textContent = view.liveInput ? 'LISTENING' : (view.playing ? 'LIVE' : 'IDLE');
      }
    }

    function renderLiveTimeline(label = 'LIVE') {
      const fill = query('#timelineFill');
      const readout = query('#timeReadout');
      if (fill) fill.style.width = '100%';
      if (readout) readout.textContent = label;
      timeline?.setAttribute('aria-valuetext', label);
    }

    function renderLiveStatus(label, recording = false) {
      const dot = query('#liveDot');
      const text = query('#liveLabel');
      if (dot) dot.className = `live-dot${recording ? ' recording' : ''}`;
      if (text) text.textContent = label;
    }

    function setAvailability(available) {
      ['playButton', 'restartButton', 'skipBackButton', 'skipForwardButton'].forEach((id) => {
        const control = query(`#${id}`);
        if (control) control.disabled = !available;
      });
    }

    return {
      bind,
      renderLiveStatus,
      renderLiveTimeline,
      renderTimeline,
      renderTransport,
      setAvailability,
      get diagnostics() { return { ready: Boolean(audio && timeline), bound }; }
    };
  }

  window.QuarticAudioController = Object.freeze({ create });
})();
