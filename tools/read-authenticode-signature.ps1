param(
  [Parameter(Mandatory = $true)]
  [string]$Target
)

$ErrorActionPreference = 'Stop'
$signature = Get-AuthenticodeSignature -LiteralPath $Target
[ordered]@{
  status = $signature.Status.ToString()
  statusMessage = $signature.StatusMessage
  signerSubject = $signature.SignerCertificate.Subject
  signerThumbprint = $signature.SignerCertificate.Thumbprint
  timestampSubject = $signature.TimeStamperCertificate.Subject
} | ConvertTo-Json -Compress
