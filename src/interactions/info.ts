import { ButtonInteraction, ChannelType, StringSelectMenuInteraction } from "discord.js";
import { ImageMenu } from "../components";
import { FetchMessageRef } from "../utils/fetch_message_reference";
import prisma from "../prisma";
import archiver from "archiver";
import config from "../config";
import fs from "fs";

export async function Select(interaction: StringSelectMenuInteraction) {

  const channel = interaction.message.channel;
  if (channel.type != ChannelType.GuildText) return;

  const messageHasReference = await FetchMessageRef(channel, interaction.message.id);
  const images = interaction.values;

  const files: { attachment: string; }[] = []
  images.map((image) => { 
    var [fileName, path] = image.split(", ");
    files.push({attachment: `archive/Content/${path}/${fileName}.png`})
  });

  if(messageHasReference != "") {
    var message = await channel.messages.fetch(messageHasReference);
    if(files.length != 0) 
      message.edit({files: files}); 
    else 
      message.delete();
    interaction.update({ components: [interaction.message.components[0], ImageMenu(interaction.component.options, images)] }); 
  }
  else
    interaction.reply({files: files}); 
}

async function fetchEntityImages(input: string, ctp: boolean): Promise<boolean> {
  let zipname = input
  zipname += ctp ? "_ctp" : "_vanilla";
  console.log(zipname);
  console.log(input);
  const result = await prisma.images.findMany({
    where: {
      InternalName: {
        OR: [
          {name: input.replaceAll("-", " ")},
          {internal_name: input.replaceAll("-", " ")}
        ]
      },
    },
    select: {
      filename: true,
      path: true,
      status: true
    }
  });
  if (result != undefined && result.length > 0) {
    const zip = fs.createWriteStream(`archive/${zipname}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
   
    archive.pipe(zip);
    let empty = ctp ? true : false;
    for (const image of result) {
      if(ctp && image.status == true) {
        archive.file(`archive/Content/${image.path}/${image.filename}.png`, {name: `${image.filename}.png`});
        empty = false;
      }
      else if(!ctp) {
        archive.file(`${config.TERRARIA_VANILLA_FILES_PATH}/${image.path}/${image.filename}.png`, {name: `${image.filename}.png`});
      }
    }
    await archive.finalize();

    if(empty) return false;
    return true;
  }
  return false;
}

async function deleteUnnecessaryFiles(interaction: ButtonInteraction, ctp: boolean) {
  let skipId: string[] = [];
  let ref = await FetchMessageRef(interaction.message.channel, interaction.message.id);

  while (ref != "") {    
    var message = await interaction.message.channel.messages.fetch(ref);
    if(message.content == '') { 
      if(message.attachments.size != 0) {
        for (let thing of message.attachments) {
          if(thing[1].contentType == "application/zip" && (ctp ? thing[1].name.includes("ctp") : thing[1].name.includes("vanilla"))) {
            await message.delete();
            break;
          }
          else {
            if(!skipId.includes(message.id))
              skipId.push(message.id);
            break;
          }
        }
      }
      else {
        break;
      }
    }
    ref = await FetchMessageRef(interaction.message.channel, interaction.message.id, skipId);
  }
}

export async function DownloadCTP(interaction: ButtonInteraction) {
  const entity = (interaction.customId.split('_')[2])

  await interaction.deferReply();

  await deleteUnnecessaryFiles(interaction, true);

  if(!await fetchEntityImages(entity, true)) 
    interaction.editReply({content: `No images found for ${entity}`});
  else
    interaction.editReply({files: [`archive/${entity}_ctp.zip`]});
}

export async function DownloadVanilla(interaction: ButtonInteraction) {
  const entity = (interaction.customId.split('_')[2])

  await interaction.deferReply();

  await deleteUnnecessaryFiles(interaction, false);

  if(!await fetchEntityImages(entity, false)) 
    interaction.editReply({content: `No images found for ${entity}`});
  else
    interaction.editReply({files: [`archive/${entity}_vanilla.zip`]});
}