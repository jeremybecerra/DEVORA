$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression

$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'comensal'))
$zipPath = Join-Path $PSScriptRoot 'DEVORA-demo-publicar.zip'
$stream = [IO.File]::Open($zipPath, [IO.FileMode]::Create)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)

try {
  Get-ChildItem -LiteralPath $siteRoot -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($siteRoot.Length + 1).Replace('\', '/')
    $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
    $source = [IO.File]::OpenRead($_.FullName)
    $target = $entry.Open()
    try { $source.CopyTo($target) }
    finally { $target.Dispose(); $source.Dispose() }
  }
}
finally { $archive.Dispose(); $stream.Dispose() }

Write-Output "ZIP listo: $zipPath"
