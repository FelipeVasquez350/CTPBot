import { DMChannel, PartialDMChannel, NewsChannel, TextChannel, PublicThreadChannel, PrivateThreadChannel, VoiceChannel, StageChannel } from "discord.js";

export async function FetchMessageRef(channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | PublicThreadChannel | PrivateThreadChannel | VoiceChannel  | StageChannel, messageId: string, skipId: string[] = []) {
  var msgId = ""
  await channel.messages.fetch({ limit: 100 }).then(messages => {
    messages.forEach(message => {
      if (message.reference?.messageId == messageId && !skipId.includes(message.id)) {
        msgId = message.id
      }
    })
  })
  return msgId;
}