(() => {
  'use strict';

  function create(options = {}) {
    const offlineLifecycle = options.offlineLifecycle;
    const liveLifecycle = options.liveLifecycle;
    const buildOfflineJob = options.buildOfflineJob;
    const buildLiveJob = options.buildLiveJob;
    const validateLive = options.validateLive;
    if (!offlineLifecycle || typeof offlineLifecycle.run !== 'function') {
      throw new TypeError('Export job coordinator requires the Offline Export Lifecycle.');
    }
    if (!liveLifecycle || typeof liveLifecycle.start !== 'function') {
      throw new TypeError('Export job coordinator requires the Live Export Lifecycle.');
    }
    if (typeof buildOfflineJob !== 'function' || typeof buildLiveJob !== 'function') {
      throw new TypeError('Export job coordinator requires offline and live renderer adapters.');
    }

    let launchMode = '';

    async function startOffline(request = {}) {
      if (launchMode) throw new Error(`An ${launchMode} export launch is already being prepared.`);
      launchMode = 'offline';
      try {
        const job = await buildOfflineJob(request);
        if (!job || typeof job.prepare !== 'function' || typeof job.render !== 'function') {
          throw new TypeError('Offline export renderer adapter is incomplete.');
        }
        return await offlineLifecycle.run(job);
      } finally {
        launchMode = '';
      }
    }

    async function startLive(request = {}) {
      if (launchMode) throw new Error(`An ${launchMode} export launch is already being prepared.`);
      const admitted = typeof validateLive === 'function' ? await validateLive(request) : true;
      if (admitted === false) return undefined;
      launchMode = 'live';
      try {
        const job = await buildLiveJob(request);
        if (!job || typeof job.prepare !== 'function' || typeof job.record !== 'function') {
          throw new TypeError('Live export renderer adapter is incomplete.');
        }
        return await liveLifecycle.start(job);
      } finally {
        launchMode = '';
      }
    }

    async function selfTest() {
      const events = [];
      let releaseOffline;
      const testOffline = {
        run: async (job) => {
          events.push('offline-run');
          await job.prepare();
          await new Promise((resolve) => { releaseOffline = resolve; });
          return { status: 'completed', mode: 'offline' };
        }
      };
      const testLive = {
        start: async (job) => {
          events.push('live-start');
          await job.prepare();
          return { status: 'recording', mode: 'live' };
        }
      };
      const coordinator = create({
        offlineLifecycle: testOffline,
        liveLifecycle: testLive,
        validateLive: (request) => {
          events.push(`validate:${request.allowed}`);
          return request.allowed;
        },
        buildOfflineJob: (request) => ({
          prepare: () => events.push(`offline-prepare:${request.label}`),
          render: () => {}
        }),
        buildLiveJob: (request) => ({
          prepare: () => events.push(`live-prepare:${request.label}`),
          record: () => {}
        })
      });

      const offlinePromise = coordinator.startOffline({ label: 'master' });
      await Promise.resolve();
      let overlapRejected = false;
      try {
        await coordinator.startLive({ allowed: true, label: 'overlap' });
      } catch (error) {
        overlapRejected = error.message.includes('offline export launch');
      }
      releaseOffline();
      const offline = await offlinePromise;
      const declined = await coordinator.startLive({ allowed: false, label: 'declined' });
      const live = await coordinator.startLive({ allowed: true, label: 'stream' });

      return overlapRejected
        && offline.status === 'completed'
        && declined === undefined
        && live.status === 'recording'
        && !coordinator.diagnostics.launching
        && events.join('|') === 'offline-run|offline-prepare:master|validate:false|validate:true|live-start|live-prepare:stream';
    }

    return Object.freeze({
      startLive,
      startOffline,
      selfTest,
      get diagnostics() {
        return Object.freeze({ ready: true, launching: Boolean(launchMode), launchMode });
      }
    });
  }

  window.QuarticExportJobCoordinator = Object.freeze({ create });
})();
