# Script para gerar ícones PNG a partir dos SVGs
# Execute este script no PowerShell se tiver ImageMagick instalado

# Converter icon-192.svg para PNG
# magick convert icon-192.svg -background none icon-192.png

# Converter icon-512.svg para PNG  
# magick convert icon-512.svg -background none icon-512.png

# OU use um conversor online:
# https://cloudconvert.com/svg-to-png
# https://image.online-convert.com/convert-to-png

# Alternativamente, você pode usar este site:
# https://favicon.io/favicon-converter/

Write-Host "INSTRUÇÕES PARA GERAR ÍCONES PNG:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opção 1 - Usar conversor online:" -ForegroundColor Yellow
Write-Host "  1. Acesse https://cloudconvert.com/svg-to-png"
Write-Host "  2. Faça upload dos arquivos icon-192.svg e icon-512.svg"
Write-Host "  3. Baixe os PNGs gerados"
Write-Host "  4. Coloque-os na pasta public/"
Write-Host ""
Write-Host "Opção 2 - Usar ImageMagick (se instalado):" -ForegroundColor Yellow
Write-Host "  magick convert public/icon-192.svg public/icon-192.png"
Write-Host "  magick convert public/icon-512.svg public/icon-512.png"
Write-Host ""
Write-Host "Opção 3 - Usar Node.js com sharp:" -ForegroundColor Yellow
Write-Host "  npm install sharp"
Write-Host "  # Em seguida crie um script para converter"
Write-Host ""
Write-Host "POR ENQUANTO: Os SVGs funcionarão, mas PNGs são mais compatíveis!" -ForegroundColor Green
