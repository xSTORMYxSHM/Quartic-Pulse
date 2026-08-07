Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'assets\quartic-pulse-fractal-logo-master.png'
$outputDirectory = Join-Path $projectRoot 'assets\installer'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

function New-InstallerBitmap {
  param(
    [int]$Width,
    [int]$Height,
    [string]$OutputPath,
    [scriptblock]$Draw
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  try {
    & $Draw $graphics $bitmap
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$logo = [System.Drawing.Image]::FromFile($sourcePath)
try {
  New-InstallerBitmap -Width 164 -Height 314 -OutputPath (Join-Path $outputDirectory 'installer-sidebar.bmp') -Draw {
    param($graphics, $bitmap)
    $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Rectangle(0, 0, 164, 314)),
      ([System.Drawing.Color]::FromArgb(5, 7, 13)),
      ([System.Drawing.Color]::FromArgb(23, 17, 49)),
      90
    )
    $graphics.FillRectangle($background, 0, 0, 164, 314)
    $background.Dispose()

    $graphics.DrawImage($logo, (New-Object System.Drawing.Rectangle(10, 18, 144, 144)))
    $cyanPen = New-Object System.Drawing.Pen(([System.Drawing.Color]::FromArgb(92, 245, 220)), 1)
    $violetPen = New-Object System.Drawing.Pen(([System.Drawing.Color]::FromArgb(135, 92, 255)), 1)
    $graphics.DrawLine($violetPen, 18, 177, 146, 177)
    $graphics.DrawLine($cyanPen, 18, 181, 106, 181)
    $cyanPen.Dispose()
    $violetPen.Dispose()

    $titleFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $pulseFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $smallFont = New-Object System.Drawing.Font('Segoe UI', 7, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 247, 255))
    $cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 245, 220))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(139, 146, 168))
    $graphics.DrawString('QUARTIC', $titleFont, $whiteBrush, 18, 198)
    $graphics.DrawString('PULSE', $pulseFont, $cyanBrush, 83, 198)
    $graphics.DrawString('AUDIO-REACTIVE FRACTALS', $smallFont, $mutedBrush, 18, 225)
    $graphics.DrawString('TEMPEST MAINFRAME', $smallFont, $mutedBrush, 18, 286)
    $titleFont.Dispose(); $pulseFont.Dispose(); $smallFont.Dispose()
    $whiteBrush.Dispose(); $cyanBrush.Dispose(); $mutedBrush.Dispose()
  }

  New-InstallerBitmap -Width 150 -Height 57 -OutputPath (Join-Path $outputDirectory 'installer-header.bmp') -Draw {
    param($graphics, $bitmap)
    $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Rectangle(0, 0, 150, 57)),
      ([System.Drawing.Color]::FromArgb(8, 10, 17)),
      ([System.Drawing.Color]::FromArgb(29, 20, 58)),
      0
    )
    $graphics.FillRectangle($background, 0, 0, 150, 57)
    $background.Dispose()
    $graphics.DrawImage($logo, (New-Object System.Drawing.Rectangle(99, 4, 49, 49)))
    $titleFont = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $smallFont = New-Object System.Drawing.Font('Segoe UI', 6, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 247, 255))
    $cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 245, 220))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(139, 146, 168))
    $graphics.DrawString('QUARTIC', $titleFont, $whiteBrush, 8, 13)
    $graphics.DrawString('PULSE', $titleFont, $cyanBrush, 50, 13)
    $graphics.DrawString('SETUP', $smallFont, $mutedBrush, 8, 32)
    $titleFont.Dispose(); $smallFont.Dispose()
    $whiteBrush.Dispose(); $cyanBrush.Dispose(); $mutedBrush.Dispose()
  }
}
finally {
  $logo.Dispose()
}

Write-Host "Installer artwork written to $outputDirectory"
