import { Message, PartialGroupDMChannel } from "discord.js";

export async function FetchMessageRef(
  channel: Message["channel"],
  messageId: string,
  skipId: string[] = [],
  filter: (message: Message<boolean>) => boolean = () => true
) {
  var msgId = ""
  if (channel instanceof PartialGroupDMChannel) return msgId;
  const self = channel.client.user?.id;
  await channel.messages.fetch({ limit: 100 }).then(messages => {
    messages.forEach(message => {
      if (message.author.id != self) return;
      if (!filter(message)) return;
      if (message.reference?.messageId == messageId && !skipId.includes(message.id)) {
        msgId = message.id
      }
    })
  })
  return msgId;
}

export const isImagePreview = (message: Message<boolean>) => message.attachments.size > 0;
