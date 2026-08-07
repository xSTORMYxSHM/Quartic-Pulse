Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$backgroundPath = Join-Path $projectRoot 'assets\social\quartic-pulse-discord-background.png'
$logoPath = Join-Path $projectRoot 'assets\quartic-pulse-fractal-logo-master.png'
$outputPath = Join-Path $projectRoot 'assets\social\quartic-pulse-0.22.0-discord.png'

$canvas = New-Object System.Drawing.Bitmap(2048, 1152, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$background = [System.Drawing.Image]::FromFile($backgroundPath)
$logo = [System.Drawing.Image]::FromFile($logoPath)

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font('Segoe UI', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-Feature([int]$x, [int]$y, [string]$text) {
  $boxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(154, 8, 13, 25))
  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(125, 92, 245, 220), 2)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 238, 244, 255))
  $featureFont = New-Font 21 ([System.Drawing.FontStyle]::Bold)
  $graphics.FillRectangle($boxBrush, $x, $y, 420, 54)
  $graphics.DrawRectangle($linePen, $x, $y, 420, 54)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 245, 220))), $x, $y, 6, 55)
  $graphics.DrawString($text, $featureFont, $textBrush, $x + 24, $y + 13)
  $boxBrush.Dispose(); $linePen.Dispose(); $textBrush.Dispose(); $featureFont.Dispose()
}

try {
  $graphics.DrawImage($background, (New-Object System.Drawing.Rectangle(0, 0, 2048, 1152)))

  $leftShade = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, 1, 4, 13))
  $graphics.FillRectangle($leftShade, 0, 0, 1140, 1152)
  $leftShade.Dispose()

  $graphics.DrawImage($logo, (New-Object System.Drawing.Rectangle(92, 74, 138, 138)))

  $eyebrowFont = New-Font 20 ([System.Drawing.FontStyle]::Bold)
  $titleFont = New-Font 76 ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Font 25 ([System.Drawing.FontStyle]::Bold)
  $taglineFont = New-Font 38 ([System.Drawing.FontStyle]::Regular)
  $taglineStrongFont = New-Font 42 ([System.Drawing.FontStyle]::Bold)
  $footerFont = New-Font 18 ([System.Drawing.FontStyle]::Bold)
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 255))
  $cyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(92, 245, 220))
  $muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(166, 176, 204))
  $violet = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(164, 119, 255))

  $graphics.DrawString('TEMPEST MAINFRAME PRESENTS', $eyebrowFont, $muted, 260, 102)
  $graphics.DrawString('WINDOWS 11  |  VERSION 0.22.0', $eyebrowFont, $cyan, 260, 147)

  $graphics.DrawString('QUARTIC', $titleFont, $white, 92, 258)
  $quarticWidth = $graphics.MeasureString('QUARTIC', $titleFont).Width
  $graphics.DrawString('PULSE', $titleFont, $cyan, 92 + $quarticWidth - 5, 258)
  $graphics.DrawString('AUDIO-REACTIVE FRACTAL VISUALIZER & MUSIC-TO-VIDEO EXPORTER', $subtitleFont, $muted, 98, 365)

  $dividerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 135, 92, 255), 3)
  $graphics.DrawLine($dividerPen, 98, 425, 910, 425)
  $dividerPen.Color = [System.Drawing.Color]::FromArgb(220, 92, 245, 220)
  $graphics.DrawLine($dividerPen, 98, 434, 610, 434)
  $dividerPen.Dispose()

  $graphics.DrawString('Other visualizers make graphics react to music.', $taglineFont, $white, 98, 492)
  $graphics.DrawString('Quartic Pulse makes the math react to music.', $taglineStrongFont, $cyan, 98, 555)

  Draw-Feature 98 694 'MUSIC-DRIVEN FRACTAL MATH'
  Draw-Feature 542 694 'DIMENSIONAL FOLDING & WARP'
  Draw-Feature 98 770 'STEELSERIES SONAR / WASAPI'
  Draw-Feature 542 770 '480P-4K VIDEO EXPORT'
  Draw-Feature 98 846 'CUSTOM PALETTES & PRESETS'
  Draw-Feature 542 846 'PORTABLE + CUSTOM INSTALLER'

  $graphics.DrawString('WINDOWS 11 x64', $footerFont, $white, 98, 1030)
  $graphics.DrawString('GPLv3+ FREE SOFTWARE', $footerFont, $violet, 304, 1030)
  $graphics.DrawString('TEMPEST MAINFRAME', $footerFont, $cyan, 528, 1030)

  $eyebrowFont.Dispose(); $titleFont.Dispose(); $subtitleFont.Dispose()
  $taglineFont.Dispose(); $taglineStrongFont.Dispose(); $footerFont.Dispose()
  $white.Dispose(); $cyan.Dispose(); $muted.Dispose(); $violet.Dispose()

  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $background.Dispose()
  $logo.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}

Write-Host "Discord announcement written to $outputPath"
