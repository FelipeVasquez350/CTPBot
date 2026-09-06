import config from './config';
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import InteractionHandler from './Interaction_handler';

export const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

client.once(Events.ClientReady, () => {
  console.log('Ready!');
  if(client.user!= null)
    client.user.setActivity('* refuses to elaborate further... *');
  else {
	  console.log("Something went terribly wrong.");
	  return;
  }
}); 

client.on('interactionCreate', async interaction => {
  try {
	  await InteractionHandler(interaction);
  }
  catch(err) {
	  console.log(err);
  }
});

client.login(config.DISCORD_TOKEN);