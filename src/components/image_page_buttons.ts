import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

function ImagePageButtons(entity: string, page: number, pages: number) {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents([
      new ButtonBuilder()
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`Info_ImagePage_${page - 1}_${entity}`)
        .setDisabled(page <= 0)
      ,
      new ButtonBuilder()
        .setLabel(`${page + 1}/${pages}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`Info_ImagePageLabel_${page}_${entity}`)
        .setDisabled(true)
      ,
      new ButtonBuilder()
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`Info_ImagePage_${page + 1}_${entity}`)
        .setDisabled(page >= pages - 1)
    ]).toJSON()
}

export default ImagePageButtons;
