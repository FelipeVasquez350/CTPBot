import { CacheType, Interaction, InteractionType, MessageFlags } from "discord.js";
import * as commandModules from './commands';
import * as interactionModules from './interactions';
import disableCommand from "./utils/disable_command";

const commands = Object(commandModules);
const interactions = Object(interactionModules);

async function respondToFailure(interaction: Interaction<CacheType>) {
  if (!interaction.isRepliable()) return;
  const content = "Something went wrong while handling that.";
  try {
    if (interaction.deferred) await interaction.editReply({ content });
    else if (interaction.replied) await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
  catch (err) {
    console.log("Could not report failure for interaction: " + interaction.id);
  }
}

function describe(interaction: Interaction<CacheType>) {
  if (interaction.isChatInputCommand()) {
    const options = interaction.options.data.map(option => `${option.name}: ${option.value}`).join(", ");
    return options == "" ? `/${interaction.commandName}` : `/${interaction.commandName} ${options}`;
  }
  if (interaction.isMessageComponent()) return interaction.customId;
  return InteractionType[interaction.type];
}

async function InteractionHandler(interaction: Interaction<CacheType>) {
  const tag = `[${interaction.id}]`;
  const started = Date.now();

  return new Promise<void>(async (resolve, reject) => {
    try {
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const { commandName } = interaction;
        await commands[commandName].autocomplete(interaction);
        resolve();
        return;
      }

      console.log(`${tag} ${describe(interaction)} by ${interaction.user.tag} (${interaction.user.id})`
        + ` in ${interaction.guild?.name ?? "a dm"}#${interaction.channelId}`);

      if (interaction.type == InteractionType.ApplicationCommand) {
        const { commandName } = interaction;
        await commands[commandName].execute(interaction);
      }
      else {
        const [interactionName, interactionFunction] = interaction.customId.split('_');
        const handler = interactions[interactionName]?.[interactionFunction];
        if (typeof handler !== "function")
          throw new Error(`No handler for ${interactionName}.${interactionFunction}`);
        await handler(interaction);
      }

      console.log(`${tag} done (${Date.now() - started}ms)`);
      resolve();
    }
    catch (err) {
      console.log(`${tag} ${describe(interaction)} failed after ${Date.now() - started}ms:`, err instanceof Error ? err.message : err);
      if (interaction.type == InteractionType.ApplicationCommand && process.env.NODE_ENV === "production")
        disableCommand(interaction);
      await respondToFailure(interaction);
      reject(err);
    }
  });
}

export default InteractionHandler;