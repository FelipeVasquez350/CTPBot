import { ButtonInteraction, ChannelType } from "discord.js";
import { random, info } from "../commands";
import { FetchMessageRef } from "../utils/fetch_message_reference";

export async function ReRoll(interaction: ButtonInteraction) {
  await random.execute(interaction);
}

export async function ShowInfo(interaction: ButtonInteraction) {
  var channel = interaction.message.channel;
  
  if (channel.type != ChannelType.GuildText) return;
  var messageHasReference = await FetchMessageRef(channel, interaction.message.id);
  
  if(messageHasReference != "") {
    var message = await channel.messages.fetch(messageHasReference);
    await info.execute(interaction, message)
  }
  else await info.execute(interaction);   
}