#!/usr/bin/env sh

wget https://github.com/Altalyra/CalamityTexturePack/releases/latest/download/CalamityTexturePack.zip -qO CalamityTexturePack.zip
rm -rf ./archive/CalamityTexturePack ./archive/Content
unzip -q CalamityTexturePack.zip -d ./archive
if [ -d ./archive/CalamityTexturePack ]; then
  mv ./archive/CalamityTexturePack/* ./archive
  rmdir ./archive/CalamityTexturePack
fi
