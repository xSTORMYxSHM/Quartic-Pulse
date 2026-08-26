(() => {
  'use strict';

  function create(options = {}) {
    const $ = options.query || ((selector) => document.querySelector(selector));
    const state = options.state;
    const audio = options.audio;
    const audioController = options.audioController;
    const desktop = options.desktop || window.quarticDesktop;
    const showToast = options.showToast || (() => {});
    const isSupportedAudioFile = options.isSupportedAudioFile || (() => false);
    const stopLiveAudio = options.stopLiveAudio || (() => {});
    const setAudioSourceStatus = options.setAudioSourceStatus || (() => {});
    const resetPulseEvents = options.resetPulseEvents || (() => {});
    const ensureAudioGraph = options.ensureAudioGraph || (() => {});
    const resumeAudio = options.resumeAudio || (async () => {});
    const audioIsActive = options.audioIsActive || (() => false);
    const cancelSongMapAnalysis = options.cancelSongMapAnalysis || (() => {});
    const onTrackChanged = options.onTrackChanged || (() => {});
    const onDeckReset = options.onDeckReset || (() => {});
    const onNowPlayingChange = options.onNowPlayingChange || (() => {});
    const onPerformanceChange = options.onPerformanceChange || (() => {});
    if (!state || !audio || !audioController) throw new Error('Playlist control requires state, audio, and transport control.');

  function currentPlaylistIndex() {
    if (state.playlistLoadedId == null) return -1;
    return state.playlist.findIndex((item) => item.id === state.playlistLoadedId);
  }

  function currentPlaylistItem() {
    const index = currentPlaylistIndex();
    return index >= 0 ? state.playlist[index] : null;
  }

  function selectPlaylistRow(index) {
    if (state.exporting) return showToast('Finish the current export before changing the playlist.', true);
    if (!state.playlist[index]) return;
    state.playlistIndex = index;
    Array.from($('#playlistList').children).forEach((row, rowIndex) => {
      const selected = rowIndex === index;
      row.classList.toggle('active', selected);
      row.setAttribute('aria-selected', String(selected));
    });
    updatePlaylistControls();
  }

  function updateTrackControls() {
    const hasTrack = Boolean(currentPlaylistItem());
    const deckAvailable = hasTrack && state.audioMode === 'deck';
    audioController.setAvailability(deckAvailable);
    $('#exportButton').disabled = !hasTrack;
    onNowPlayingChange();
    onPerformanceChange();
  }

  function updatePlaylistControls() {
    const count = state.playlist.length;
    const selected = state.playlistIndex >= 0 && state.playlistIndex < count;
    const loadedIndex = currentPlaylistIndex();
    const navigationIndex = loadedIndex >= 0 ? loadedIndex : state.playlistIndex;
    $('#playlistCount').textContent = `${count} ${count === 1 ? 'TRACK' : 'TRACKS'}`;
    $('#playlistEmpty').hidden = count > 0;
    $('#playlistCurrentLabel').textContent = selected ? `SELECTED ${state.playlistIndex + 1} / ${count}` : 'NOTHING SELECTED';
    $('#playlistPreviousButton').disabled = navigationIndex <= 0 || state.exporting;
    $('#playlistNextButton').disabled = navigationIndex < 0 || navigationIndex >= count - 1 || state.exporting;
    $('#playlistMoveUpButton').disabled = !selected || state.playlistIndex <= 0 || state.exporting;
    $('#playlistMoveDownButton').disabled = !selected || state.playlistIndex >= count - 1 || state.exporting;
    $('#playlistRemoveButton').disabled = !selected || state.exporting;
    $('#playlistClearButton').disabled = count === 0 || state.exporting;
  }

  function renderPlaylist() {
    const list = $('#playlistList');
    list.replaceChildren();
    state.playlist.forEach((item, index) => {
      const button = document.createElement('button');
      const number = document.createElement('span');
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const meta = document.createElement('small');
      const kind = document.createElement('span');
      button.type = 'button';
      const selected = index === state.playlistIndex;
      const loaded = item.id === state.playlistLoadedId;
      button.className = `playlist-item${selected ? ' active' : ''}${loaded ? ' loaded' : ''}`;
      button.title = loaded ? 'Loaded in the Music Deck' : 'Click to select · double-click to load and play';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(selected));
      number.className = 'playlist-item-index';
      number.textContent = String(index + 1).padStart(2, '0');
      copy.className = 'playlist-item-copy';
      title.textContent = item.name;
      meta.textContent = item.meta;
      copy.append(title, meta);
      kind.className = 'playlist-item-kind';
      kind.textContent = loaded ? 'LOADED' : 'FILE';
      button.append(number, copy, kind);
      button.addEventListener('click', () => selectPlaylistRow(index));
      button.addEventListener('dblclick', () => selectPlaylistIndex(index, true).catch((error) => showToast(error.message, true)));
      list.appendChild(button);
    });
    updatePlaylistControls();
  }

  async function selectPlaylistIndex(index, autoplay = false) {
    if (state.exporting) return showToast('Finish the current export before changing tracks.', true);
    const item = state.playlist[index];
    if (!item) return;
    if (state.audioMode !== 'deck') stopLiveAudio();
    $('#audioSourceSelect').value = 'deck';
    setAudioSourceStatus('DECK', false);
    audio.pause();
    cancelSongMapAnalysis();
    resetPulseEvents();
    state.playlistIndex = index;
    state.playlistLoadedId = item.id;
    state.audioName = item.name;
    audio.src = item.source;
    audio.load();
    // A source swap can occur before the media element's asynchronous pause
    // event updates the HUD. Reset the transport immediately for a newly
    // loaded track unless this activation explicitly requested autoplay.
    setPlayState();
    $('#trackName').textContent = item.name;
    $('#trackMeta').textContent = item.meta;
    audioController.renderTimeline(0, 0);
    $('#revealButton').hidden = true;
    updateTrackControls();
    renderPlaylist();
    onTrackChanged();
    showToast(`${item.name} loaded${autoplay ? ' and playing' : ''}`);
    if (autoplay) {
      ensureAudioGraph();
      await resumeAudio();
      await audio.play();
    }
  }

  async function addLocalFiles(files, { activate = false, autoplay = false } = {}) {
    const validFiles = Array.from(files || []).filter(isSupportedAudioFile);
    if (!validFiles.length) {
      if (files?.length) showToast('No supported audio files were found.', true);
      return false;
    }
    const firstIndex = state.playlist.length;
    for (const file of validFiles) {
      const relativePath = file.webkitRelativePath || '';
      let filePath = '';
      try { filePath = desktop.getPathForFile(file); } catch (_) { /* Offline export will report if no path is available. */ }
      state.playlist.push({
        id: ++state.playlistId,
        name: file.name.replace(/\.[^.]+$/, ''),
        meta: relativePath ? `FOLDER · ${relativePath}` : `${file.type || 'Audio file'} · ${(file.size / 1048576).toFixed(1)} MB`,
        source: URL.createObjectURL(file),
        file,
        filePath
      });
    }
    renderPlaylist();
    if (activate || state.playlistIndex < 0) await selectPlaylistIndex(firstIndex, autoplay);
    showToast(`${validFiles.length} ${validFiles.length === 1 ? 'track' : 'tracks'} added to Playlist`);
    return true;
  }

  async function loadAudio(file) {
    if (!file) return;
    if (state.exporting) return showToast('Finish the current export before loading another track.', true);
    await addLocalFiles([file], { activate: true });
  }

  function movePlaylistItem(direction) {
    const from = state.playlistIndex;
    const to = from + direction;
    if (from < 0 || to < 0 || to >= state.playlist.length || state.exporting) return;
    const [item] = state.playlist.splice(from, 1);
    state.playlist.splice(to, 0, item);
    state.playlistIndex = to;
    renderPlaylist();
    showToast(`${item.name} moved`);
  }

  function removeCurrentPlaylistItem() {
    const index = state.playlistIndex;
    if (index < 0 || state.exporting) return;
    const [removed] = state.playlist.splice(index, 1);
    const removedLoadedTrack = removed.id === state.playlistLoadedId;
    URL.revokeObjectURL(removed.source);
    state.playlistIndex = state.playlist.length ? Math.min(index, state.playlist.length - 1) : -1;
    if (removedLoadedTrack) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      state.playlistLoadedId = null;
      resetAudioDeck();
    }
    renderPlaylist();
    showToast(`${removed.name} removed${removedLoadedTrack ? ' · playback stopped' : ''}`);
  }

  function resetAudioDeck() {
    resetPulseEvents();
    state.audioName = '';
    cancelSongMapAnalysis();
    $('#trackName').textContent = 'No audio loaded';
    $('#trackMeta').textContent = 'Drop songs anywhere, choose files, or choose a local folder';
    audioController.renderTimeline(0, 0);
    updateTrackControls();
    setPlayState();
    onDeckReset();
  }

  function clearPlaylist() {
    if (state.exporting) return;
    if (state.audioMode !== 'deck') stopLiveAudio();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.playlist.forEach((item) => URL.revokeObjectURL(item.source));
    state.playlist = [];
    state.playlistIndex = -1;
    state.playlistLoadedId = null;
    resetAudioDeck();
    renderPlaylist();
    showToast('Playlist cleared');
  }

  async function changePlaylistTrack(direction, forcePlay = false) {
    const loadedIndex = currentPlaylistIndex();
    const referenceIndex = loadedIndex >= 0 ? loadedIndex : state.playlistIndex;
    const nextIndex = referenceIndex + direction;
    if (nextIndex < 0 || nextIndex >= state.playlist.length) return;
    const autoplay = forcePlay || !audio.paused;
    await selectPlaylistIndex(nextIndex, autoplay);
  }

  async function togglePlayback() {
    if (!audio.src || state.exporting || state.audioMode !== 'deck') return;
    ensureAudioGraph();
    await resumeAudio();
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } else audio.pause();
  }

  function setPlayState() {
    const liveInput = state.audioMode !== 'deck' && audioIsActive();
    const deckPlaying = state.audioMode === 'deck' && !audio.paused;
    const playing = liveInput || deckPlaying;
    audioController.renderTransport({ liveInput, deckPlaying, playing, exporting: state.exporting });
  }


    return Object.freeze({
      addFiles: addLocalFiles,
      changeTrack: changePlaylistTrack,
      clear: clearPlaylist,
      currentIndex: currentPlaylistIndex,
      currentItem: currentPlaylistItem,
      loadAudio,
      moveItem: movePlaylistItem,
      removeCurrent: removeCurrentPlaylistItem,
      render: renderPlaylist,
      resetDeck: resetAudioDeck,
      selectIndex: selectPlaylistIndex,
      selectRow: selectPlaylistRow,
      setPlayState,
      togglePlayback,
      updateControls: updatePlaylistControls,
      updateTrackControls
    });
  }

  window.QuarticPlaylistController = Object.freeze({ create });
})();
