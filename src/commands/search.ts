import { SlashCommandBuilder, ChatInputCommandInteraction, ButtonInteraction, EmbedBuilder, ActionRow, MessageActionRowComponent, MessageFlags, AutocompleteInteraction } from "discord.js";
import { SearchMenu } from "../components";
import prisma from '../prisma';
import SearchButtons from "../components/search_buttons";
import { execute as info } from "./info"
import fuzzysort from "fuzzysort";

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Search for entities inside the bot\'s database through their files and localizations')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('The type of entry')
      .addChoices(
        { name: 'Images', value: 'Images' },
        { name: 'Sounds', value: 'Sounds' },
        { name: 'Music', value: 'Music' },
        { name: 'Localization Texts', value: 'LocalizationTexts' }
      )
      .setRequired(true))
  .addStringOption(option =>
    option.setName('id')
      .setDescription('The file name, or the id for a localization')
      .setRequired(true)
      .setAutocomplete(true)
  );

const COLUMNS: { [key: string]: string } = {
  Images: 'filename',
  Sounds: 'sound_name',
  Music: 'music_title',
  LocalizationTexts: 'localization_id',
};

async function identifiers(type: string): Promise<string[]> {
  switch (type) {
    case 'Images':
      return (await prisma.images.findMany({ select: { filename: true }, distinct: ['filename'], orderBy: { filename: 'asc' } }))
        .map(row => row.filename!);
    case 'Sounds':
      return (await prisma.sounds.findMany({ select: { sound_name: true }, distinct: ['sound_name'], orderBy: { sound_name: 'asc' } }))
        .map(row => row.sound_name!);
    case 'Music':
      return (await prisma.music.findMany({ select: { music_title: true }, distinct: ['music_title'], orderBy: { music_title: 'asc' } }))
        .map(row => row.music_title!);
    case 'LocalizationTexts':
      return (await prisma.localizationTexts.findMany({ select: { localization_id: true }, distinct: ['localization_id'], orderBy: { localization_id: 'asc' } }))
        .map(row => row.localization_id!);
  }
  return [];
}

export async function execute(interaction: ChatInputCommandInteraction | ButtonInteraction, page: number = 0) {
  var input: string;
  var type: string;
  if (interaction.isButton()) {
    await interaction.deferUpdate();
    const parts = (interaction.message.components[1] as ActionRow<MessageActionRowComponent>).components[0].customId!.split('_');
    type = parts[3];
    input = parts.slice(4).join('_');
  } else {
   await interaction.deferReply();
   input = `${interaction.options.get('id')?.value}`;
   type = `${interaction.options.get('type')?.value}`;
  }
  const column = COLUMNS[type];

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
    await info(interaction, null, entity[0].name)
    return;
  }
  else if(entity.length != 0)
    await interaction.editReply({ embeds: [embed], components: [SearchMenu(entity.slice(0,25)), SearchButtons(page == 0, entity.length < 25, page, type, input)]});
  else if(interaction.isCommand())
    await interaction.editReply({ content: 'No entity found' });
  else
    await interaction.followUp({ content: 'No entity found', flags: MessageFlags.Ephemeral });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const type = `${interaction.options.get('type')?.value ?? ''}`;

  if (COLUMNS[type] == undefined) {
    await interaction.respond([]);
    return;
  }

  const focusedValue = interaction.options.getFocused();
  const ids = await identifiers(type);
  const choices = focusedValue == ""
    ? ids
    : fuzzysort.go(focusedValue, ids).map(({ target }) => target);

  await interaction.respond(
    choices.slice(0, 25).map(choice => ({ name: choice, value: choice })),
  );
}
