import { ButtonInteraction, ChannelType, StringSelectMenuInteraction } from "discord.js";
import { FetchMessageRef } from "../utils/fetch_message_reference";
import { info, search } from "../commands";

export async function Select(interaction: StringSelectMenuInteraction) {
  var channel = interaction.message.channel;
  
  if (channel.type != ChannelType.GuildText) return;
  var messageHasReference = await FetchMessageRef(channel, interaction.message.id);

  if(messageHasReference != "") {
    var message = await channel.messages.fetch(messageHasReference);
    await info.execute(interaction, message)
  }
  else await info.execute(interaction);   
}

export async function Previous(interaction: ButtonInteraction) {
  var page: number = parseInt(interaction.customId.split('_')[2])-1;
  await search.execute(interaction,page);
}

export async function Next(interaction: ButtonInteraction) {
  var page: number = parseInt(interaction.customId.split('_')[2])+1;
  await search.execute(interaction,page);
}