import { CacheType, Interaction, InteractionType } from "discord.js";
import * as commandModules from './commands';
import * as interactionModules from './interactions';
import disableCommand from "./utils/disable_command";

const commands = Object(commandModules);
const interactions = Object(interactionModules);

async function InteractionHandler(interaction: Interaction<CacheType>) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const { commandName } = interaction;
        await commands[commandName].autocomplete(interaction);
        resolve();
      }
      else if (interaction.type == InteractionType.ApplicationCommand) {
        const { commandName } = interaction;
        await commands[commandName].execute(interaction);
        resolve(); 
      }
      else {
        const [interactionName, interactionFunction] = interaction.customId.split('_');
        console.log(interactionName, interactionFunction);
        console.log(interactions);
        await interactions[interactionName][interactionFunction](interaction);
        resolve();
      } 
    }
    catch (err) {
      console.log("Error in interaction handler by: " + interaction.id);
      if (interaction.type == InteractionType.ApplicationCommand && process.env.NODE_ENV === "production") 
        disableCommand(interaction);
      reject(err);
    }
  });
}

export default InteractionHandler;