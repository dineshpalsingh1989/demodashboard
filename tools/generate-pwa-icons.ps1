# Regenerate the install icons with: powershell -ExecutionPolicy Bypass -File tools/generate-pwa-icons.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$out = Join-Path $root 'assets/icons'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$canvas = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Rectangle]::new(0, 0, 512, 512)),
  ([System.Drawing.ColorTranslator]::FromHtml('#112d52')),
  ([System.Drawing.ColorTranslator]::FromHtml('#1679b8')),
  35
)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$sky = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#b8ebff'))
$window = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#226b9d'))
$g.FillRectangle($background, 0, 0, 512, 512)
$g.FillEllipse($sky, 336, 118, 52, 52)

# Keep the city mark inside the middle 70% so Android's maskable crop is safe.
$g.FillRectangle($white, 128, 242, 70, 137)
$g.FillRectangle($white, 205, 182, 104, 197)
$g.FillRectangle($white, 316, 222, 68, 157)
$g.FillRectangle($white, 116, 370, 280, 17)
foreach ($x in @(145, 170, 225, 253, 281, 333, 358)) {
  $yStart = if ($x -ge 205 -and $x -le 281) { 211 } elseif ($x -ge 316) { 250 } else { 268 }
  for ($y = $yStart; $y -le 345; $y += 31) { $g.FillRectangle($window, $x, $y, 10, 13) }
}
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 12
$g.DrawArc($pen, 150, 125, 212, 165, 204, 132)
$g.FillEllipse($white, 133, 211, 16, 16)
$g.FillEllipse($white, 360, 211, 16, 16)

foreach ($size in @(192, 512)) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.DrawImage($canvas, 0, 0, $size, $size)
  $bitmap.Save((Join-Path $out "smart-city-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}
$pen.Dispose()
$window.Dispose()
$sky.Dispose()
$white.Dispose()
$background.Dispose()
$g.Dispose()
$canvas.Dispose()
