import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

function RandButtons(input: string) {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents([
      new ButtonBuilder()
        .setCustomId(`Random_ReRoll_${input}`)
        .setLabel('Re-Roll')
        .setStyle(ButtonStyle.Secondary)
      ,
      new ButtonBuilder()
        .setCustomId('Random_ShowInfo')
        .setLabel('Show Info')
        .setStyle(ButtonStyle.Success)
    ])
  .toJSON()
}

export default RandButtons;