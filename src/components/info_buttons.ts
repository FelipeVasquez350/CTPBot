import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

function InfoButtons(entity: string) {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents([
      new ButtonBuilder()
        .setLabel('Download CTP')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`Info_DownloadCTP_${entity}`)
      ,
      new ButtonBuilder()
        .setLabel('Download Vanilla')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`Info_DownloadVanilla_${entity}`)
    ]).toJSON()
}

export default InfoButtons;