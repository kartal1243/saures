Add-Type -AssemblyName System.Drawing

$srcFile = "frontend\public\brand\logo-dukkanim.jpg"
if (-not (Test-Path $srcFile)) {
    Write-Error "Source file not found: $srcFile"
    exit 1
}

$img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $srcFile).Path)
$w = $img.Width
$h = $img.Height
Write-Host "Loaded source image: $w x $h"

# 1. Calculate non-white bounding box
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0

for ($y = 0; $y -lt $h; $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# Add small 8px padding
$minX = [Math]::Max(0, $minX - 8)
$maxX = [Math]::Min($w - 1, $maxX + 8)
$minY = [Math]::Max(0, $minY - 8)
$maxY = [Math]::Min($h - 1, $maxY + 8)

$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1

Write-Host "Content bounds: X=$minX..$maxX, Y=$minY..$maxY (Size: $cropW x $cropH)"

# 2. Trimmed version with crisp white background
$croppedWhite = New-Object System.Drawing.Bitmap($cropW, $cropH)
$gw = [System.Drawing.Graphics]::FromImage($croppedWhite)
$gw.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gw.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), $minX, $minY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
$gw.Dispose()
$croppedWhite.Save("frontend\public\brand\logo-dukkanim-white.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-dukkanim-white.png"

# 3. Transparent version (Full logo: illustration + text)
$croppedTrans = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gt = [System.Drawing.Graphics]::FromImage($croppedTrans)
$gt.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gt.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), $minX, $minY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
$gt.Dispose()

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $croppedTrans.GetPixel($x, $y)
        $bright = ($c.R + $c.G + $c.B) / 3.0
        if ($c.R -gt 250 -and $c.G -gt 250 -and $c.B -gt 250) {
            $croppedTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } elseif ($bright -gt 238) {
            $alpha = [int]([Math]::Max(0, [Math]::Min(255, (255 - $bright) * 15)))
            $croppedTrans.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
    }
}
$croppedTrans.Save("frontend\public\brand\logo-dukkanim.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved transparent logo-dukkanim.png"

# 4. Icon only (Top illustration: smartphone + store + cart + location pin)
# In the original crop, the illustration takes the top 62%
$iconH = [int]($cropH * 0.62)
# Find horizontal bounds for icon only
$iconMinX = $cropW; $iconMaxX = 0
for ($y = 0; $y -lt $iconH; $y += 2) {
    for ($x = 0; $x -lt $cropW; $x += 2) {
        $c = $croppedWhite.GetPixel($x, $y)
        if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
            if ($x -lt $iconMinX) { $iconMinX = $x }
            if ($x -gt $iconMaxX) { $iconMaxX = $x }
        }
    }
}
$iconMinX = [Math]::Max(0, $iconMinX - 6)
$iconMaxX = [Math]::Min($cropW - 1, $iconMaxX + 6)
$actualIconW = $iconMaxX - $iconMinX + 1

$iconBmp = New-Object System.Drawing.Bitmap($actualIconW, $iconH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gi = [System.Drawing.Graphics]::FromImage($iconBmp)
$gi.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gi.DrawImage($croppedTrans, (New-Object System.Drawing.Rectangle(0, 0, $actualIconW, $iconH)), $iconMinX, 0, $actualIconW, $iconH, [System.Drawing.GraphicsUnit]::Pixel)
$gi.Dispose()
$iconBmp.Save("frontend\public\brand\logo-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-icon.png"

# 4.1 Horizontal Logo (Icon on Left + Text on Right)
$textYStart = [int]($cropH * 0.60)
$textH = $cropH - $textYStart
$textMinX = $cropW; $textMaxX = 0; $textMinY = $cropH; $textMaxY = 0

for ($y = $textYStart; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $croppedTrans.GetPixel($x, $y)
        if ($c.A -gt 25) {
            if ($x -lt $textMinX) { $textMinX = $x }
            if ($x -gt $textMaxX) { $textMaxX = $x }
            if ($y -lt $textMinY) { $textMinY = $y }
            if ($y -gt $textMaxY) { $textMaxY = $y }
        }
    }
}
$textW = $textMaxX - $textMinX + 1
$actualTextH = $textMaxY - $textMinY + 1

# Extract text bitmap
$textBmp = New-Object System.Drawing.Bitmap($textW, $actualTextH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gtx = [System.Drawing.Graphics]::FromImage($textBmp)
$gtx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gtx.DrawImage($croppedTrans, (New-Object System.Drawing.Rectangle(0, 0, $textW, $actualTextH)), $textMinX, $textMinY, $textW, $actualTextH, [System.Drawing.GraphicsUnit]::Pixel)
$gtx.Dispose()

# Create horizontal composite: Target Height = 100px
$targetLogoH = 100
$scaleIcon = [double]$targetLogoH / $iconH
$hIconW = [int]($actualIconW * $scaleIcon)

$scaleText = [double]($targetLogoH * 0.78) / $actualTextH
$hTextW = [int]($textW * $scaleText)
$hTextH = [int]($actualTextH * $scaleText)

$spacing = 18
$totalHLogoW = $hIconW + $spacing + $hTextW

$horizBmp = New-Object System.Drawing.Bitmap($totalHLogoW, $targetLogoH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gh = [System.Drawing.Graphics]::FromImage($horizBmp)
$gh.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gh.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gh.DrawImage($iconBmp, 0, 0, $hIconW, $targetLogoH)
$textPosY = [int](($targetLogoH - $hTextH) / 2)
$gh.DrawImage($textBmp, ($hIconW + $spacing), $textPosY, $hTextW, $hTextH)
$gh.Dispose()
$horizBmp.Save("frontend\public\brand\logo-horizontal.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved logo-horizontal.png (Size: $totalHLogoW x $targetLogoH)"

# 5. App Icons (icon-512.png and icon-192.png)
$appIcon = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ga = [System.Drawing.Graphics]::FromImage($appIcon)
$ga.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ga.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$scale = [Math]::Min(450.0 / $actualIconW, 450.0 / $iconH)
$tw = [int]($actualIconW * $scale)
$th = [int]($iconH * $scale)
$tx = [int]((512 - $tw) / 2)
$ty = [int]((512 - $th) / 2)

$ga.DrawImage($iconBmp, $tx, $ty, $tw, $th)
$ga.Dispose()
$appIcon.Save("frontend\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved icon-512.png"

$appIcon192 = New-Object System.Drawing.Bitmap(192, 192, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ga192 = [System.Drawing.Graphics]::FromImage($appIcon192)
$ga192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ga192.DrawImage($appIcon, 0, 0, 192, 192)
$ga192.Dispose()
$appIcon192.Save("frontend\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved icon-192.png"

# Cleanup
$img.Dispose()
$croppedWhite.Dispose()
$croppedTrans.Dispose()
$iconBmp.Dispose()
$appIcon.Dispose()
$appIcon192.Dispose()
Write-Host "All assets generated successfully!"
