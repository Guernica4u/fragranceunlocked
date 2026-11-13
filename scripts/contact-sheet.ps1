param([string]$Manifest, [string]$Out, [int]$Cols = 7, [int]$Cell = 180)
Add-Type -AssemblyName System.Drawing
$items = Get-Content -Raw -Path $Manifest | ConvertFrom-Json
$rows = [math]::Ceiling($items.Count / $Cols)
$labelH = 42
$W = $Cols * $Cell
$H = $rows * ($Cell + $labelH)
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Arial', 8)
$brush = [System.Drawing.Brushes]::Black
for ($k = 0; $k -lt $items.Count; $k++) {
  $it = $items[$k]
  $x = ($k % $Cols) * $Cell
  $y = [math]::Floor($k / $Cols) * ($Cell + $labelH)
  try {
    $img = [System.Drawing.Image]::FromFile($it.path)
    $scale = [math]::Min(($Cell - 10) / $img.Width, ($Cell - 10) / $img.Height)
    $w = [int]($img.Width * $scale)
    $h = [int]($img.Height * $scale)
    $g.DrawImage($img, $x + [int](($Cell - $w) / 2), $y + [int](($Cell - $h) / 2), $w, $h)
    $img.Dispose()
  } catch {
    $g.DrawString('load error', $font, $brush, $x + 5, $y + 5)
  }
  $rect = New-Object System.Drawing.RectangleF ($x + 2), ($y + $Cell), ($Cell - 4), $labelH
  $g.DrawString([string]$it.label, $font, $brush, $rect)
}
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "wrote $Out ($($items.Count) items)"
