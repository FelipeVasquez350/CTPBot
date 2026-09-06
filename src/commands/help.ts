import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Generic info about the bot uses');

export async function execute(interaction: CommandInteraction) {
  
  const embed = new EmbedBuilder()
  .setColor('#23a55a')
  .setTitle('Help')
  .setDescription('If you\'re searching on how to use the slash commands refeer to the command self-description, or visit the GitHub page linked down below this message.\n\nIf you come across any errors with the bot, notify either\n @da.im (old daim#6490) or @felipe350 (old Felipe350#5384),\nunless, of course if:\n - during 2-8am gmt+1\n- either Daim or Felipe are gone ~~once again~~\n- you are from the future by at least 20y: <t:1689713400:R>\n- the server is dead')
  .addFields([
    { name: 'Version', value: "2.1.0", inline: true },
    { name: 'GitHub', value: "https://github.com/FelipeVasquez350/CTPBot", inline: true }
  ]);

  await interaction.reply({embeds: [embed]});
}