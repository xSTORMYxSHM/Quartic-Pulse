const packageJson = require('../package.json');

const config = structuredClone(packageJson.build);
config.win.azureSignOptions = {
  publisherName: process.env.WINDOWS_SIGNING_PUBLISHER || 'CN=Garner Whitted, O=Garner Whitted, L=Seattle, S=wa, C=US',
  endpoint: process.env.AZURE_TRUSTED_SIGNING_ENDPOINT || 'https://wus2.codesigning.azure.net/',
  codeSigningAccountName: process.env.AZURE_TRUSTED_SIGNING_ACCOUNT || 'Tempest',
  certificateProfileName: process.env.AZURE_TRUSTED_SIGNING_PROFILE || 'TempestSoftwarePublic',
  fileDigest: 'SHA256',
  timestampDigest: 'SHA256'
};

module.exports = config;
