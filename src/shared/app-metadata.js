(() => {
  'use strict';

  const metadata = Object.freeze({
    application: 'quartic-pulse',
    productName: 'Quartic Pulse',
    version: '0.40.0',
    releaseChannel: 'release-candidate'
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = metadata;
  if (typeof window !== 'undefined') window.QuarticAppMetadata = metadata;
})();
