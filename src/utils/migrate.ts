/*
  Hello v here
  If you're reading this, you're probably trying to figure out how to migrate the data from the old database (JSON) to the new one (Sqlite).
  This is NOT HOW
  This is a script I wrote to migrate as part of the data from the old database to the new one, but it's not the one I used to migrate the rest of the data.
  Why am i leaving this here then? Idk fear of deleting code I guess
  
  Do NOT use this
  Do NOT try to understand how it works
  
  But most importantly, 
  
  DO NOT PUT THIS IN PRODUCTION (or anywhere else for that matter)
  This is a script I wrote in a few hours, it's not meant to be used by anyone else, and it's not meant to be used in production.
*/

import config from '../config';
import { readFile } from 'fs/promises';
import prisma from '../prisma';
import fs from "fs";
import path from 'path';
import sizeOf from 'image-size';

type toFix = {
  OldName: string;
  NewName: string;
}

interface Sprite {
  FileName: string;
  Type: string;
  Sprited: boolean;
}
  
interface Entry {
  Name: string;
  Sprites: Sprite[];
}

type EntityList = Entry[];

config

async function findPath(folderPath: string, filename: string): Promise<string[]> {
  const files = fs.readdirSync(folderPath);
  const dirs: string[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const found = await findPath(filePath, filename);
      dirs.push(...found);
    } else if(file == filename) {
      dirs.push(path.relative('archive/Vanilla/', folderPath));
    }
  }
  return dirs;
}


async function defineInternalName(internalName: string): Promise<string> {
  const jsonData = await readFile("src/utils/FIX.json", 'utf-8');
  const dataList: toFix[] = JSON.parse(jsonData);

  for (const entry of dataList) {
    if(entry.OldName == internalName) {
      return entry.NewName;
    }
  }

  return "";
}

async function  isInternalNameCanonical(internalName: string) {
  const result = await prisma.internalNames.findMany({
    where: { internal_name: internalName },
  });
  return result.length == 0 ? false : true;
}

async function migrateData(jsonFilePath: string): Promise<void> {
  const jsonData = await readFile(jsonFilePath, 'utf-8');
  const dataList: EntityList = JSON.parse(jsonData);

  for (const entry of dataList) {
    if(entry.Name == "SkeletronHandItem") continue;
    if(await isInternalNameCanonical(entry.Name) == false) {
      let internalName = await defineInternalName(entry.Name);
      if(internalName == "") {
        return;
      }
      else {
        const correct: Entry = {
          Name: internalName,
          Sprites: entry.Sprites
        } 
        await addFixedEntities(correct);
      }
    }
  }
}

async function addFixedEntities(correct: Entry): Promise<boolean> {
  let internal_id = await prisma.internalNames.findMany({
    where: { internal_name: correct.Name },
    select: { internal_id: true }
  });

  for (const sprite of correct.Sprites) {

    let path = await findPath("archive/Vanilla/Images/", sprite.FileName+".png");
    
    for (const p of path) {
      const size = sizeOf(`archive/Vanilla/${p}/${sprite.FileName}.png`);
      
      if(path.length > 1)
        console.log("Ducplica path for "+sprite.FileName+" is "+p);

      
      let result = await prisma.images.create({
        data: {
          internal_id: internal_id[0].internal_id,
          filename: sprite.FileName,
          path: p,
          type: sprite.Type,
          status: sprite.Sprited,
          width: size.width,
          height: size.height
        }
      });

      console.log(result);
    }

  }

  return true;
}


async function getFolder(directory: string) {
  const files = fs.readdirSync(directory);
  const map: string[] = [];
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
  
    if (stats.isDirectory()) {
      const found = await getFolder(filePath);
      map.push(...found);
    }
    else {
      map.push(path.relative('archive/Vanilla/', directory)+"/"+file);
    }
  }
  return map;
}
  
async function checkForMissing() {
  const folder = await getFolder("archive/Vanilla");
  const dbImages = await prisma.images.findMany({
    select: {
      filename: true,
      path: true
    }
  });

  for (const file of folder) {
   // fs.writeFileSync("test.txt", file+"\n", {flag: "a"})
    if(!dbImages.find((image) => (image.path+"/"+image.filename+".png") == file)) {
      console.log(`could not find file: ${file}`)
      fs.writeFileSync("mssingImages.txt", `${file}\n`, {flag: "a"})
    }
  }

//onsole.log(folder);
}

async function checkForWrongSize() {
  const dbImages = await prisma.images.findMany({
    select: {
      image_id: true,
      filename: true,
      path: true,
      width: true,
      height: true
    }
  });

  for (const image of dbImages) {
    try{
      const size = sizeOf(`archive/Vanilla/${image.path}/${image.filename}.png`);
      if(size.width != image.width || size.height != image.height) {
        console.log(`wrong size for ${image.path}/${image.filename}.png: ${size.width}x${size.height} instead of ${image.width}x${image.height}`);
        //fs.writeFileSync("wrongSize.txt", `${image.path}/${image.filename}.png: ${size.width}x${size.height} instead of ${image.width}x${image.height}\n`, {flag: "a"})
        await prisma.images.update({
          where: {
            image_id: image.image_id,
            filename: image.filename,
            path: image.path
          },
          data: {
            width: size.width,
            height: size.height
          }
        });
      }
    }
    catch(err) {
      console.log(err);
    }
  }
}

async function checkForDanglingRef() {
  const dbImages = await prisma.images.findMany({
    select: {
      image_id: true,
      internal_id: true,
    }
  });

  const dbInternalNames = await prisma.internalNames.findMany({
    select: {
      internal_id: true
    }
  });

  for (const image of dbImages) {
    if(!dbInternalNames.find((internalName) => internalName.internal_id == image.internal_id)) {
      console.log(`dangling reference for ${image.image_id}`);
      //fs.writeFileSync("danglingRef.txt", `${image.image_id}\n`, {flag: "a"})
      // await prisma.images.delete({
      //   where: {
      //     image_id: image.image_id
      //   }
      // });
    }
  }
}

async function updatePackDB() {
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
}

//migrateData("src/utils/List.json");

/* THINGS TO CHECK WHEN MIGRATING
  - Check for missing images
  - Check for wrong size
  - Check for dangling references for images
  - Update the pack database to the latest version
*/ 

// checkForMissing();
// checkForWrongSize();
// checkForDanglingRef();
// updatePackDB();
