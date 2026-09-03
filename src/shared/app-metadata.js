(() => {
  'use strict';

  const metadata = Object.freeze({
    application: 'quartic-pulse',
    productName: 'Quartic Pulse',
    version: '1.0.1',
    releaseChannel: 'stable'
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = metadata;
  if (typeof window !== 'undefined') window.QuarticAppMetadata = metadata;
})();
