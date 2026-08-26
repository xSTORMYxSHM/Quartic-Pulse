(() => {
  'use strict';

  function create(options = {}) {
    const workflow = options.workflow;
    const controller = options.controller;
    if (!workflow || typeof workflow.update !== 'function' || typeof workflow.begin !== 'function'
      || typeof workflow.complete !== 'function' || typeof workflow.handleNative !== 'function') {
      throw new TypeError('Export progress coordinator requires the Export Progress Workflow Engine.');
    }
    if (!controller || typeof controller.renderProgress !== 'function' || typeof controller.begin !== 'function'
      || typeof controller.setNote !== 'function' || typeof controller.setActions !== 'function'
      || typeof controller.hide !== 'function') {
      throw new TypeError('Export progress coordinator requires the Export Controller.');
    }

    let removeNativeListener = null;

    function update(overall, panelText, stageText = panelText) {
      return workflow.update(overall, panelText, stageText, {
        render: (view) => controller.renderProgress(view)
      });
    }

    function begin(panelText, stageText = panelText) {
      return workflow.begin(panelText, stageText, {
        started: () => controller.begin(),
        render: (view) => controller.renderProgress(view)
      });
    }

    function handleNative(message) {
      return workflow.handleNative(message, {
        note: (text) => controller.setNote(text),
        render: (view) => controller.renderProgress(view)
      });
    }

    function complete(outputPath, config = {}) {
      const shouldPlayStinger = config.shouldPlayStinger || options.shouldPlayStinger;
      const playStinger = config.playStinger || options.playStinger;
      const isExporting = config.isExporting || options.isExporting;
      return workflow.complete(outputPath, {
        render: (view) => controller.renderProgress(view),
        note: (text) => controller.setNote(text),
        setActions: (endEnabled, cancelEnabled) => controller.setActions(endEnabled, cancelEnabled),
        shouldPlayStinger,
        playStinger,
        isExporting,
        hide: () => controller.hide()
      });
    }

    function unbindNative() {
      removeNativeListener?.();
      removeNativeListener = null;
    }

    function bindNative(subscribe) {
      unbindNative();
      if (typeof subscribe !== 'function') return false;
      const remove = subscribe((message) => handleNative(message));
      if (typeof remove === 'function') removeNativeListener = remove;
      return true;
    }

    async function selfTest() {
      const events = [];
      let nativeCallback = null;
      let nativeRemoved = false;
      const testWorkflow = {
        update(overall, panelText, stageText, config) {
          const view = { overall, panelText, stageText };
          config.render?.(view);
          return view;
        },
        begin(panelText, stageText, config) {
          config.started?.();
          return this.update(0, panelText, stageText, config);
        },
        handleNative(message, config) {
          if (message.id !== 'active') return { status: 'ignored' };
          config.note?.('native-note');
          config.render?.({ overall: message.progress, panelText: message.message, stageText: message.stage });
          return { status: message.stage };
        },
        complete(outputPath, config) {
          config.render?.({ overall: 1, panelText: outputPath, stageText: 'saved' });
          config.note?.('complete-note');
          config.setActions?.(false, false);
          if (config.shouldPlayStinger?.()) config.playStinger?.();
          if (!config.isExporting?.()) config.hide?.();
          return { status: 'completed', outputPath };
        }
      };
      const testController = {
        renderProgress: (view) => events.push(`render:${view.panelText}`),
        begin: () => events.push('begin'),
        setNote: (text) => events.push(`note:${text}`),
        setActions: (end, cancel) => events.push(`actions:${end}:${cancel}`),
        hide: () => events.push('hide')
      };
      const coordinator = create({
        workflow: testWorkflow,
        controller: testController,
        shouldPlayStinger: () => true,
        playStinger: () => events.push('stinger'),
        isExporting: () => false
      });
      coordinator.begin('starting', 'stage-starting');
      coordinator.update(.25, 'rendering', 'stage-rendering');
      const bound = coordinator.bindNative((callback) => {
        nativeCallback = callback;
        return () => { nativeRemoved = true; };
      });
      nativeCallback({ id: 'active', stage: 'finalizing', progress: .8, message: 'native' });
      const ignored = coordinator.handleNative({ id: 'other', stage: 'saving', progress: 1, message: 'wrong' });
      const completed = coordinator.complete('finished.mp4');
      coordinator.unbindNative();
      return bound
        && nativeRemoved
        && ignored.status === 'ignored'
        && completed.status === 'completed'
        && events.join('|') === 'begin|render:starting|render:rendering|note:native-note|render:native|render:finished.mp4|note:complete-note|actions:false:false|stinger|hide';
    }

    return Object.freeze({
      begin,
      bindNative,
      complete,
      handleNative,
      selfTest,
      unbindNative,
      update,
      get diagnostics() {
        return Object.freeze({ ready: true, nativeListenerBound: Boolean(removeNativeListener) });
      }
    });
  }

  window.QuarticExportProgressCoordinator = Object.freeze({ create });
})();
