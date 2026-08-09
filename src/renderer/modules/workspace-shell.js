(() => {
  'use strict';

  const workspaceDefinitions = Object.freeze({
    music: Object.freeze({
      title: 'MUSIC',
      basic: 'Sources, playback, playlists, and song analysis',
      advanced: 'Audio sources, analysis, frequency color, and deck routing',
      tabs: Object.freeze(['music', 'playlist', 'analysis', 'frequency-color'])
    }),
    appearance: Object.freeze({
      title: 'VISUALS',
      basic: 'Choose a visual, starting look, palette, and intensity',
      advanced: 'Visual design, equation response, dimensions, folding, and mapping',
      tabs: Object.freeze(['appearance', 'reactivity', 'dimensional', 'folding', 'mapping'])
    }),
    live: Object.freeze({
      title: 'PERFORM',
      basic: 'Build a show, enter Performance Mode, or open stream output',
      advanced: 'Composer, live control routing, camera paths, tools, and OBS',
      tabs: Object.freeze(['show', 'composer', 'controls', 'camera', 'tools', 'stream'])
    }),
    export: Object.freeze({
      title: 'EXPORT',
      basic: 'Create a high-quality video with guided export settings',
      advanced: 'Offline rendering, encoding, formats, recovery, and history',
      tabs: Object.freeze(['export'])
    }),
    system: Object.freeze({
      title: 'SYSTEM',
      basic: 'Performance recommendations, reports, and project information',
      advanced: 'Hardware limits, advanced features, diagnostics, and licenses',
      tabs: Object.freeze(['system', 'reports', 'about'])
    })
  });

  const navigationGroups = Object.freeze({
    music: Object.freeze({ nav: '.music-subtabs', button: '.music-subtab', dataKey: 'musicTab' }),
    appearance: Object.freeze({ nav: '.appearance-subtabs', button: '.appearance-subtab', dataKey: 'appearanceTab' }),
    live: Object.freeze({ nav: '.live-subtabs', button: '.live-subtab', dataKey: 'liveTab' }),
    system: Object.freeze({ nav: '.system-subtabs', button: '.system-subtab', dataKey: 'systemTab' })
  });

  function normalizeTab(requestedTab, interfaceMode) {
    let tabName = requestedTab === 'live' ? 'show' : requestedTab;
    if (interfaceMode === 'basic' && ['reactivity', 'dimensional', 'folding', 'mapping'].includes(tabName)) {
      tabName = 'appearance';
    }
    return tabName;
  }

  function workspaceForTab(tabName) {
    return Object.keys(workspaceDefinitions).find((workspace) => workspaceDefinitions[workspace].tabs.includes(tabName)) || 'music';
  }

  function updateInspector(workspace, interfaceMode) {
    const definition = workspaceDefinitions[workspace];
    const title = document.querySelector('#inspectorWorkspaceTitle');
    const description = document.querySelector('#interfaceModeDescription');
    if (title) title.textContent = definition.title;
    if (description) description.textContent = definition[interfaceMode === 'advanced' ? 'advanced' : 'basic'];
  }

  function activate(requestedTab, interfaceMode = 'basic') {
    const tabName = normalizeTab(requestedTab, interfaceMode);
    const workspace = workspaceForTab(tabName);

    document.body.classList.toggle('appearance-active', workspace === 'appearance');
    document.body.dataset.workspace = workspace;

    document.querySelectorAll('.settings-tab').forEach((button) => {
      const active = button.dataset.tab === workspace;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.workspace-button').forEach((button) => {
      const active = button.dataset.workspace === workspace;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });

    Object.entries(navigationGroups).forEach(([groupName, group]) => {
      const navigation = document.querySelector(group.nav);
      if (navigation) navigation.hidden = workspace !== groupName;
      document.querySelectorAll(group.button).forEach((button) => {
        const active = workspace === groupName && button.dataset[group.dataKey] === tabName;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const active = panel.dataset.tabPanel === tabName;
      panel.classList.toggle('active', active);
      if (active) panel.scrollTop = 0;
    });

    updateInspector(workspace, interfaceMode);
    return Object.freeze({ tabName, workspace });
  }

  function bindNavigation(onActivate) {
    document.querySelector('.workspace-rail')?.addEventListener('click', (event) => {
      const button = event.target.closest('.workspace-button');
      if (button) onActivate(button.dataset.workspace);
    });
    document.querySelector('.settings-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('.settings-tab');
      if (button) onActivate(button.dataset.tab);
    });
    Object.values(navigationGroups).forEach((group) => {
      document.querySelector(group.nav)?.addEventListener('click', (event) => {
        const button = event.target.closest(group.button);
        if (button) onActivate(button.dataset[group.dataKey]);
      });
    });
  }

  function syncInterfaceMode(mode) {
    document.querySelectorAll('[data-interface-mode]').forEach((button) => {
      const active = button.dataset.interfaceMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateInspector(document.body.dataset.workspace || 'music', mode);
  }

  function bindInterfaceMode(onModeChange) {
    document.querySelectorAll('.interface-mode-switch').forEach((switcher) => {
      switcher.addEventListener('click', (event) => {
        const button = event.target.closest('[data-interface-mode]');
        if (button) onModeChange(button.dataset.interfaceMode);
      });
    });
  }

  window.QuarticWorkspaceShell = Object.freeze({
    activate,
    bindInterfaceMode,
    bindNavigation,
    normalizeTab,
    syncInterfaceMode,
    workspaceDefinitions,
    workspaceForTab
  });
})();
