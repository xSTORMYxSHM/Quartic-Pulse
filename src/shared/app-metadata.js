(() => {
  'use strict';

  const metadata = Object.freeze({
    application: 'quartic-pulse',
    productName: 'Quartic Pulse',
    version: '0.50.0',
    releaseChannel: 'stable'
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = metadata;
  if (typeof window !== 'undefined') window.QuarticAppMetadata = metadata;
})();
