(() => {
  'use strict';

  function create(options = {}) {
    const session = options.sessionEngine;
    if (!session || typeof session.begin !== 'function' || typeof session.clear !== 'function') {
      throw new TypeError('Export recovery requires the Export Session Engine.');
    }

    function validId(id) {
      const normalized = String(id || '').trim();
      if (!normalized) throw new TypeError('Export recovery requires a valid recovery ID.');
      return normalized;
    }

    async function recover(id, config = {}) {
      if (typeof config.recover !== 'function') {
        throw new TypeError('Export recovery requires a desktop recovery operation.');
      }
      const recoveryId = validId(id);
      let result = null;
      let completed = false;
      session.begin({ id: recoveryId }, 'offline');
      try {
        await config.started?.({ id: recoveryId });
        result = await config.recover(recoveryId);
        if (!result || typeof result !== 'object' || !result.outputPath) {
          throw new TypeError('Export recovery returned an invalid result.');
        }
        await config.completed?.({ id: recoveryId, result });
        completed = true;
        return Object.freeze({ status: 'completed', id: recoveryId, result });
      } catch (error) {
        await config.failed?.({ id: recoveryId, result, error });
        throw error;
      } finally {
        session.clear();
        await config.restored?.({ id: recoveryId, result, completed });
      }
    }

    async function discard(id, config = {}) {
      if (typeof config.discard !== 'function') {
        throw new TypeError('Export discard requires a desktop discard operation.');
      }
      const recoveryId = validId(id);
      try {
        await config.started?.({ id: recoveryId });
        const result = await config.discard(recoveryId);
        await config.completed?.({ id: recoveryId, result });
        return Object.freeze({ status: 'discarded', id: recoveryId, result });
      } catch (error) {
        await config.failed?.({ id: recoveryId, error });
        throw error;
      } finally {
        await config.restored?.({ id: recoveryId });
      }
    }

    async function selfTest() {
      const recoverEvents = [];
      const testSession = {
        begin: ({ id }, mode) => recoverEvents.push(`begin:${id}:${mode}`),
        clear: () => recoverEvents.push('clear')
      };
      const engine = create({ sessionEngine: testSession });
      const recovered = await engine.recover('recover-1', {
        started: async () => recoverEvents.push('started'),
        recover: async (id) => ({ outputPath: `${id}.mkv` }),
        completed: async ({ result }) => recoverEvents.push(`completed:${result.outputPath}`),
        restored: async ({ completed }) => recoverEvents.push(`restored:${completed}`)
      });
      const completedSequence = recoverEvents.join('|');

      const discardEvents = [];
      const discarded = await engine.discard('discard-1', {
        started: async () => discardEvents.push('started'),
        discard: async (id) => ({ id }),
        completed: async ({ id }) => discardEvents.push(`completed:${id}`),
        restored: async () => discardEvents.push('restored')
      });

      const failureEvents = [];
      let failureRethrown = false;
      try {
        await engine.recover('failure-1', {
          recover: async () => { throw new Error('Expected recovery failure'); },
          failed: async ({ error }) => failureEvents.push(error.message),
          restored: async ({ completed }) => failureEvents.push(`restored:${completed}`)
        });
      } catch (error) {
        failureRethrown = error?.message === 'Expected recovery failure';
      }

      let invalidRejected = false;
      try {
        await engine.recover('invalid-1', { recover: async () => null });
      } catch (error) {
        invalidRejected = error instanceof TypeError;
      }

      return recovered.status === 'completed'
        && completedSequence === 'begin:recover-1:offline|started|completed:recover-1.mkv|clear|restored:true'
        && discarded.status === 'discarded'
        && discardEvents.join('|') === 'started|completed:discard-1|restored'
        && failureRethrown
        && failureEvents.join('|') === 'Expected recovery failure|restored:false'
        && invalidRejected;
    }

    return Object.freeze({
      recover,
      discard,
      selfTest,
      diagnostics: Object.freeze({ ready: true })
    });
  }

  window.QuarticExportRecoveryEngine = Object.freeze({ create });
})();
