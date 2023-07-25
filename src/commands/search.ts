import { SlashCommandBuilder, CommandInteraction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { SearchMenu } from "../components";
import prisma from '../prisma';
import SearchButtons from "../components/search_buttons";
import { execute as info } from "./info"

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Search for entities inside the bot\'s database through files')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('The type of file')
      .addChoices(
        { name: 'Images', value: 'Images' },
        { name: 'Sounds', value: 'Sounds' },
        { name: 'Music', value: 'Music' },
        { name: 'Localization Texts', value: 'LocalizationTexts' }
      )
      .setRequired(true))
  .addStringOption(option =>
    option.setName('input')
      .setDescription('The file name')
      .setRequired(true)
  );
  
export async function execute(interaction: CommandInteraction | ButtonInteraction, page: number = 0) {
  var input: string;
  var type: string;
  if (interaction.isButton()) {
    [, , , input, type] = interaction.message.components[1].components[0].customId!.split('_');
  } else {
   input = `${interaction.options.data[1].value}`;
   type = `${interaction.options.data[0].value}`;
  }
  const column = {
    Images: 'filename',
    Sounds: 'sound_name',
    Music: 'music_title',
    LocalizationTexts: 'localization_type',
  }[type];
 
  const entity = await prisma.internalNames.findMany({
    where: { 
      [type]: {
        some: {
         [column!]: input
        }
      }
    },
    select: {
      name: true
    },
    distinct: ['name'],
    orderBy: {
      ['name']: 'asc'
    },
    skip: page * 25  
  });

  const embed = new EmbedBuilder()
    .setColor('#23a55a')
    .setTitle(`Search results for ${input}`)
    .setDescription(`Found ${entity.length} entities`)
    .toJSON();
  
  if(entity.length == 1) {
    info(interaction, null, entity[0].name)
    return;
  }
  else if(entity.length != 0) { 
    if(interaction.isCommand())
      interaction.reply({ embeds: [embed], components: [SearchMenu(entity.slice(0,25)), SearchButtons(page == 0, entity.length < 25, page, input, type)]});            
    else 
      interaction.update({ embeds: [embed], components: [SearchMenu(entity.slice(0,25)), SearchButtons(page == 0, entity.length < 25, page, input, type)]});
    }
  else
    interaction.reply({ content: 'No entity found', ephemeral: true });
}  