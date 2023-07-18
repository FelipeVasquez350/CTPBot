import { execSync } from 'child_process';
import prisma from '../prisma';
import fs from "fs";

// Update the pack database
export async function updatePackDB(packVersion: string) {
  const images = await prisma.images.findMany();
  
  images.forEach(async image => {
    try {
      if (fs.existsSync(`archive/Content/${image.path}/${image.filename}.png`) != image.status) {
        console.log(`${image.filename}.png needs update to ${!image.status}`)

        await prisma.images.update({
          where: {
            image_id: image.image_id
          },
          data: {
            status: !image.status
          }
        });
        console.log(`${image.filename}.png updated to ${!image.status}`)
      }
    } catch(err) {
      console.error(err)
    }    
  });        

  await prisma.packInfo.update({
    where: {
      name: "Calamity Texture Pack"
    },
    data: {
      version: packVersion
    }
  })

  // Commit to GitHub
  console.log(`Committing to GitHub...\nPackVersion: ${packVersion}`)

  if(process.platform === 'win32') {
    console.log("Windows detected");
    execSync(`npm run update:Windows --var=${packVersion}`);
    console.log("Update complete");
  }
  else {
    console.log("Non-Windows detected");
    execSync(`npm run update:Linux --var=${packVersion}`);
    console.log("Update complete");
  }
}