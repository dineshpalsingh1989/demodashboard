# Generate narration with an installed Windows SAPI voice. Output stays in this checkout.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$voice = New-Object -ComObject SAPI.SpVoice
$voices = $voice.GetVoices()
for ($i = 0; $i -lt $voices.Count; $i++) {
    if ($voices.Item($i).GetDescription() -match 'Zira') { $voice.Voice = $voices.Item($i); break }
}
$voice.Rate = 1
foreach ($folder in @('short-video-of-iriv-pi', 'short-video-of-iriv-edgeai')) {
    $config = Get-Content -LiteralPath (Join-Path $projectRoot "$folder/narration.json") -Raw -Encoding UTF8 | ConvertFrom-Json
    $audioDir = Join-Path $projectRoot ".tmp/video-build/$folder"
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
    for ($i = 0; $i -lt $config.scenes.Count; $i++) {
        $scene = $config.scenes[$i]
        $segments = @(if ($scene.segments) { $scene.segments } else { [pscustomobject]@{ text = $scene.text } })
        for ($j = 0; $j -lt $segments.Count; $j++) {
            $file = Join-Path $audioDir "$i-$j.wav"
            $stream = New-Object -ComObject SAPI.SpFileStream
            try {
                $stream.Format.Type = 22 # 22050 Hz, 16-bit mono PCM
                $stream.Open($file, 3, $false)
                $voice.AudioOutputStream = $stream
                [void]$voice.Speak($segments[$j].text)
            } finally { $stream.Close() }
        }
    }
    Write-Output "Narration clips generated: $folder"
}
& node (Join-Path $PSScriptRoot 'prepare-iriv-audio.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Audio preparation failed' }
