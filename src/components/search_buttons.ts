import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

function SearchButtons(previousEnabled: boolean, nextEnabled: boolean, page: number, type: string, id: string) {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents([
      new ButtonBuilder()
        .setCustomId(`Search_Previous_${page}_${type}_${id}`)
        .setLabel('Show Previous')
        .setStyle(ButtonStyle.Success)
        .setDisabled(previousEnabled)
      ,  
      new ButtonBuilder()
        .setCustomId(`Search_Next_${page}_${type}_${id}`)
        .setLabel('Show Next')
        .setStyle(ButtonStyle.Success)
        .setDisabled(nextEnabled)
    ])
  .toJSON()
}

export default SearchButtons; 