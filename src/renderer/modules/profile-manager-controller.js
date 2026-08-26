(() => {
  'use strict';

  function create(options = {}) {
    const query = options.query || ((selector) => document.querySelector(selector));
    const documentRef = options.documentRef || document;
    const getProfiles = options.getProfiles || (() => []);
    const findProfile = options.findProfile || ((profiles, id) => profiles.find((profile) => profile.id === id) || null);
    let bound = false;
    let initialized = false;

    function selectedProfile() {
      return findProfile(getProfiles(), query('#savedProfileSelect').value);
    }

    function setStatus(message) {
      query('#profileStatus').textContent = message;
    }

    function visibleProfiles() {
      const search = query('#profileSearch')?.value.trim().toLowerCase() || '';
      const profiles = (Array.isArray(getProfiles()) ? getProfiles() : [])
        .filter((profile) => !search || profile.name.toLowerCase().includes(search) || profile.kind.includes(search))
        .sort((first, second) => Number(Boolean(second.favorite)) - Number(Boolean(first.favorite))
          || String(second.updatedAt || '').localeCompare(String(first.updatedAt || '')));
      return { profiles, search };
    }

    function render(preferredId = '') {
      const select = query('#savedProfileSelect');
      const previousId = preferredId || select.value;
      const visible = visibleProfiles();
      select.replaceChildren();
      if (!visible.profiles.length) {
        const option = documentRef.createElement('option');
        option.value = '';
        option.textContent = visible.search ? 'No matching profiles' : 'No saved profiles';
        select.appendChild(option);
        select.value = '';
      } else {
        for (const profile of visible.profiles) {
          const option = documentRef.createElement('option');
          option.value = profile.id;
          option.textContent = `${profile.favorite ? '★ ' : ''}${profile.kind === 'colors' ? 'COLOR' : 'FULL'} · ${profile.name}`;
          select.appendChild(option);
        }
        select.value = visible.profiles.some((profile) => profile.id === previousId) ? previousId : visible.profiles[0].id;
      }

      const profile = selectedProfile();
      const hasSelection = Boolean(profile);
      ['#applyProfileButton', '#favoriteProfileButton', '#deleteProfileButton', '#exportProfileButton']
        .forEach((selector) => { query(selector).disabled = !hasSelection; });
      if (profile) {
        query('#favoriteProfileButton').textContent = `${profile.favorite ? '★' : '☆'} FAVORITE`;
        const profileType = profile.kind === 'colors' ? 'Color Palette' : 'Full Visual Settings';
        setStatus(`${profileType} · saved ${new Date(profile.updatedAt || profile.createdAt).toLocaleString()}`);
      } else {
        query('#favoriteProfileButton').textContent = '☆ FAVORITE';
        setStatus(visible.search ? 'No saved profile matches this search.' : 'Profiles are saved locally as JSON-compatible data.');
      }
      options.onRendered?.(profile);
      return profile;
    }

    function report(action, error) {
      options.onError?.(`${action}: ${error?.message || String(error)}`, error);
    }

    function bind() {
      if (bound) return;
      bound = true;
      query('#profileSearch').addEventListener('input', () => render());
      query('#savedProfileSelect').addEventListener('change', () => render(query('#savedProfileSelect').value));
      query('#saveProfileButton').addEventListener('click', () => {
        try { options.onSave?.(); } catch (error) { report('Profile could not be saved', error); }
      });
      query('#quickSaveProfileButton').addEventListener('click', () => {
        try { options.onQuickSave?.(); } catch (error) { report('Preset could not be saved', error); }
      });
      query('#resetActiveVisualButton').addEventListener('click', () => options.onReset?.());
      query('#applyProfileButton').addEventListener('click', () => {
        try {
          const profile = selectedProfile();
          if (profile) options.onApply?.(profile);
        } catch (error) { report('Profile could not be applied', error); }
      });
      query('#favoriteProfileButton').addEventListener('click', () => {
        const profile = selectedProfile();
        if (profile) options.onFavorite?.(profile);
      });
      query('#deleteProfileButton').addEventListener('click', () => {
        const profile = selectedProfile();
        if (profile) options.onDelete?.(profile);
      });
      query('#exportProfileButton').addEventListener('click', async () => {
        try {
          const profile = selectedProfile();
          if (profile) await options.onExport?.(profile);
        } catch (error) { report('Export failed', error); }
      });
      query('#importProfileButton').addEventListener('click', () => query('#importProfileInput').click());
      query('#importProfileInput').addEventListener('change', async (event) => {
        try {
          const file = event.target.files?.[0];
          if (file) await options.onImport?.(file);
        } catch (error) { report('Import failed', error); }
        finally { event.target.value = ''; }
      });
    }

    function initialize() {
      initialized = true;
      bind();
      render();
    }

    const diagnostics = {
      get ready() { return true; },
      get bound() { return bound; },
      get initialized() { return initialized; }
    };

    return Object.freeze({
      bind,
      initialize,
      render,
      selectedProfile,
      setStatus,
      visibleProfiles,
      get diagnostics() { return diagnostics; }
    });
  }

  window.QuarticProfileManagerController = Object.freeze({ create });
})();
