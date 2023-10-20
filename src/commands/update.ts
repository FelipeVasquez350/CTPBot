import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { updatePackDB } from "../utils/update_pack_db";
import { execSync } from 'child_process';
import prisma from '../prisma';
import fs from "fs";

export const data = new SlashCommandBuilder()
  .setName('update')
  .setDescription('Updates the bot to the latest version of the pack it can find on the GitHub Page.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog);


export async function execute(interaction: CommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor('#EA8000')
    .setTitle('Updating...')
    .setDescription('Wait for the update to finish before using the bot again.')
    .setImage(`https://cdn.discordapp.com/attachments/754393146888290330/1010276554858827826/loading.gif`)
    .toJSON();
    
  interaction.reply({ embeds: [embed] }).then(async() => {
    execSync("npm run fetch");

    const CTP = await prisma.packInfo.findUnique({ where: { name: "Calamity Texture Pack" } });    
    const packJson = JSON.parse(fs.readFileSync(`archive/pack.json`, 'utf8'));
    const packVersion = packJson["Version"];
   
    if(CTP != null && CTP.version === `${packVersion["major"]}.${packVersion["minor"]}`) {
      const embed = new EmbedBuilder()
        .setColor('#23a55a')
        .setTitle('Up to date')
        .setDescription('The bot is already up to date.')
        .toJSON()
      interaction.editReply({ embeds: [embed] });
    }
    else {
      await updatePackDB(`${packVersion["major"]}.${packVersion["minor"]}`)
      const embed = new EmbedBuilder()
        .setColor('#23a55a')
        .setTitle('Updated!')
        .setDescription('The bot has successfully updated to the latest pack version.')
        .toJSON()
      interaction.editReply({ embeds: [embed] });
    }
  });
}