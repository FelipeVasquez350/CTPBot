import prisma from '../prisma';
import fs from "fs";

// Update the pack database
export async function updatePackDB(packVersion: string) {
  const images = await prisma.images.findMany();
  let changed = 0;

  for (const image of images) {
    const present = fs.existsSync(`archive/Content/${image.path}/${image.filename}.png`);
    if (present == image.status) continue;

    await prisma.images.update({
      where: { image_id: image.image_id },
      data: { status: present }
    });
    changed++;
    console.log(`${image.filename}.png -> ${present}`);
  }

  await prisma.packInfo.update({
    where: { name: "Calamity Texture Pack" },
    data: { version: packVersion }
  });

  console.log(`Updated ${changed} image flags, pack version set to ${packVersion}`);
  return changed;
}
