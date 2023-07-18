import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";
import sizeOf from 'image-size';
import config from "../config";
import prisma from "../prisma";
import path from 'path';
import fs from "fs";

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Some statistics about the current status of the texture pack');

type Stats = {
  total: number;
  misspellings: number;
  wrong_dimensions: number;
  misspellings_list: string[];
  wrong_dimensions_list: string[];
}

async function scanFolder(folderPath: string): Promise<Stats> {
  var total = 0;
  var misspellings = 0;
  var wrong_dimensions = 0;
  var misspellings_list: string[] = [];
  var wrong_dimensions_list: string[] = [];

  const folder = fs.readdirSync(folderPath);
  for (const file of folder) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const sub_stats = await scanFolder(filePath);
      total += sub_stats.total;
      misspellings += sub_stats.misspellings;
      wrong_dimensions += sub_stats.wrong_dimensions;
    } else {
      total++;
      const relativePath = path.relative('archive/Content', folderPath);
      const size = sizeOf(filePath);
      try {      
        const vanillaPath = path.join(config.TERRARIA_VANILLA_FILES_PATH, relativePath, file);    
        const vanillaSize = sizeOf(vanillaPath);        
        if(size.width != vanillaSize.width || size.height != vanillaSize.height) {
          wrong_dimensions++;
          wrong_dimensions_list.push(`${relativePath}/${file}`);
        }
      } catch (error) {
        misspellings++;
        misspellings_list.push(`${relativePath}/${file}`);
      }     
    }
  }
  return {
    total: total, 
    misspellings: misspellings, 
    wrong_dimensions: wrong_dimensions,
    misspellings_list: misspellings_list, 
    wrong_dimensions_list: wrong_dimensions_list
  };
}

async function getTotalImagesVanilla(vanillaPath: string): Promise<number> {
  var total = 0;
  const folder = fs.readdirSync(vanillaPath);
  for (const file of folder) {
    const filePath = path.join(vanillaPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      total += await getTotalImagesVanilla(filePath);
    } else {
      total++;
    }
  }
  return total;
}

export async function execute(interaction: CommandInteraction) {
  
  const stats = await scanFolder("archive/Content/Images/");
  const totalVanilla = await getTotalImagesVanilla(`${config.TERRARIA_VANILLA_FILES_PATH}/Images/`);
   
  fs.writeFileSync('archive/misspellings.txt', stats.misspellings_list.join('\n'));
  fs.writeFileSync('archive/wrong_dimensions.txt', stats.wrong_dimensions_list.join('\n'));

  const version = await prisma.packInfo.findUnique({ where: { name: "Calamity Texture Pack" } });

  const fields = [
    {
        name: 'Texture pack version',
        value: `${version?.version}`,
        inline: false
    },
    {
      name: 'Total images sprited',
      value: `${stats.total}`,
      inline: true
    },
    {
      name: 'Total images',
      value: `${totalVanilla}`,
      inline: true
    },
    {
      name: 'Completion rate',
      value: `${Math.round((stats.total / totalVanilla + Number.EPSILON) * 10000)/100}%`,
      inline: true
    },
    {
      name: 'Total images misspelled',
      value: `${stats.misspellings}`,
      inline: true
    },
    {
      name: 'Total images with wrong dimensions',
      value: `${stats.wrong_dimensions}`,
      inline: true
    } 
  ];

  const embed = new EmbedBuilder()
    .setColor('#23a55a')
    .setTitle('Status')
    .addFields(fields)
    .toJSON();
  
  await interaction.reply({embeds: [embed]})
  await interaction.followUp({files: [{attachment: 'archive/misspellings.txt', name: 'misspellings.txt'}, {attachment: 'archive/wrong_dimensions.txt', name: 'wrong_dimensions.txt'}]});
}