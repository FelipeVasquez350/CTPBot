import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, InteractionReplyOptions, InteractionEditReplyOptions, APIActionRowComponent, APIComponentInMessageActionRow, StringSelectMenuInteraction, Message, AutocompleteInteraction, ChannelType, ButtonInteraction } from "discord.js";
import { InfoButton, ImageMenu, ImagePageButtons, ImagePageCount, SearchMenu } from '../components';
import { FetchMessageRef, isImagePreview } from '../utils/fetch_message_reference';
import prisma from '../prisma';
import { AsciiTable3 } from "ascii-table3";
import fuzzysort from "fuzzysort";
import { Images, LocalizationTexts, Music, Sounds } from "../generated/prisma/client";

const SECTIONS = [
  { label: 'Images',        value: 'Images' },
  { label: 'Sounds',        value: 'Sounds' },
  { label: 'Music',         value: 'Music' },
  { label: 'Localizations', value: 'LocalizationTexts' },
];

const ALL_SECTIONS = SECTIONS.map(section => section.value);

const DEFAULT_SECTIONS = ['Images'];

export function parseSections(input: string): Set<string> {
  const wanted = new Set<string>();

  for (const part of input.split(',')) {
    const token = part.trim().toLowerCase();
    if (token == '') continue;
    if (token == 'all') return new Set(ALL_SECTIONS);
    const match = SECTIONS.find(section =>
      section.label.toLowerCase() == token || section.value.toLowerCase() == token);
    if (match != undefined) wanted.add(match.value);
  }

  return wanted.size == 0 ? new Set(DEFAULT_SECTIONS) : wanted;
}

function sectionLabels(sections: Set<string>) {
  return SECTIONS.filter(section => sections.has(section.value))
    .map(section => section.label).join(", ");
}

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Get info about an entity.')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('The entity name')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption(option =>
    option.setName('internal_name')
      .setDescription('The entity internal name')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Which data to show, pick as many as you want (default: images)')
      .setRequired(false)
      .setAutocomplete(true)
  );

/**
 * Executes the interaction's command code.
 * @param {ChatInputCommandInteraction} interaction The istance of the interaction.
 */
export async function execute(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ButtonInteraction, message: Message<boolean> | null = null, entity_name: string | null = null) {
  var input = "";
  var sections = new Set(ALL_SECTIONS);

  const respond = (payload: InteractionReplyOptions & InteractionEditReplyOptions) =>
    interaction.deferred || interaction.replied
      ? interaction.editReply(payload)
      : interaction.reply(payload);

  if(interaction.isCommand() && entity_name == null) {
    if(!interaction.deferred && !interaction.replied)
      await interaction.deferReply();

    if(interaction.options.data.length == 0) {
      const errorEmbed = new EmbedBuilder()
      .setColor('#EA8000')
      .setTitle(`Help`)
      .setDescription("You seem to have used the command without any input.\nIn case you're confused on how to use this command, here's a quick guide:\n### How to use\n```\n/info name: Zombie\n/info internal_name: ArmedZombie\n/info name: Zombie type: Images, Sounds\n```\n`name` — The name of the entity you want to search for.\n\n`internal_name` — Its [internal name](https://terraria.wiki.gg/wiki/Data_IDs).\nBoth have an autocomplete selection to make searching easier. Discord marks them as optional (i don't make the rules, discord's api does), but you need at least one of them, and if you use both the bot relies only on `name`.\n\n`type` — Which data to show. Its autocomplete adds one entry at a time to the selection, so you can ask for several at once, and it has an `All` entry for every one of them. Leaving it out shows the images.\n-# Tip: got a file name instead of an entity? `/search type: Images id: NPC_3` finds whichever entity it belongs to.")
      .toJSON();
      await respond({embeds: [errorEmbed]});
      return;
    }
    else {
      const byName = interaction.options.get('name')?.value;
      const byInternal = interaction.options.get('internal_name')?.value;
      if (byName == null && byInternal == null) {
        await respond({ content: "Give a `name` or an `internal_name` to look up." });
        return;
      }
      input = `${byName ?? byInternal}`;
      sections = parseSections(`${interaction.options.get('type')?.value ?? ''}`);
    }
  }
  else if(interaction.isAnySelectMenu())
    input = interaction.values[0];
  else if(interaction.isButton())
    input = interaction.message.embeds[0].title!;
  else if(entity_name != null)
    input = entity_name;

  //The prisma query structure
  const entities = await prisma.internalNames.findMany({
    where: {
      OR: [
        {name: input},
        {internal_name: input}
      ]
    },
    include: {
      Images: true,
      Sounds: true,
      Music: true,
      LocalizationTexts: true,
    }
  });

  //IF the query returns a result
  if (input != undefined && entities.length != 0) {

    var images: Images[] = [];
    var sounds: Sounds[] = [];
    var music: Music[] = [];
    var localizations: LocalizationTexts[] = [];

    // Maps to avoid duplicates
    var imagesMap: { [key: string]: boolean } = {};
    var soundsMap: { [key: string]: boolean } = {};
    var musicMap: { [key: string]: boolean } = {};
    var localizationsMap: { [key: string]: boolean } = {};

    for (var ent of entities) {
      for (var img of ent.Images) {
        var key = img.filename! + img.path!;
        if (!imagesMap[key]) {
          images.push(img);
          imagesMap[key] = true;
        }
      }

      for (var snd of ent.Sounds) {
        var key = snd.sound_internal_name!;
        if (!soundsMap[key]) {
          sounds.push(snd);
          soundsMap[key] = true;
        }
      }

      for (var msc of ent.Music) {
        var key = msc.music_title!;
        if (!musicMap[key]) {
          music.push(msc);
          musicMap[key] = true;
        }
      }

      for (var loc of ent.LocalizationTexts) {
        var key = loc.localization_id! + loc.localization_type!;
        if (!localizationsMap[key]) {
          localizations.push(loc);
          localizationsMap[key] = true;
        }
      }
    }

    const entity = {
      name: entities[0].name,
      internal_name: [ ...entities.map((entity) => entity.internal_name) ],
      Images: images,
      Sounds: sounds,
      Music: music,
      LocalizationTexts: localizations,
    }

    //If the entity has no images
    if (entity.Images.length == 0 && sections.has("Images")) {
      const errorEmbed = new EmbedBuilder()
      .setColor('#D70022')
      .setTitle(`${input}`)
      .setDescription(`An error has okuued.\nNo image found.`)
      .toJSON();

      await respond({content: "\n<@318776123540504577>", embeds: [errorEmbed]});
    }
    else {
      const entityFields = [
        { name: 'Name', value: entity.name, inline: true },
        { name: 'InternalName', value: entity.internal_name.join(", "), inline: true  },
      ];
      var disableTable = false;
      var imageTable = new AsciiTable3().setHeading("Filename","Path","Status").setAlignCenter(0).setStyle("unicode-mix");
      var musicTable = new AsciiTable3().setHeading("Music_id").setAlignCenter(0).setStyle("unicode-mix");
      var soundTable = new AsciiTable3().setHeading("Sound_id").setAlignCenter(0).setStyle("unicode-mix");
      var localizationTable = new AsciiTable3().setHeading("Localization_id","Localization_Type").setAlignCenter(0).setStyle("unicode-mix");
      var stringTable = "```";
      var extras = "";   // music/sounds/localization: small, and never dropped

      var HasImages = false;
      entity.Images.map((image) => {
        if (image.status == true) {
          HasImages = true;
        }
        imageTable.addRow(image.filename, image.path, image.status);
        imageTable.toString

        if(`${image.filename}+${image.path}+${image.status}`.length > 49)
          disableTable = true;
      });

      //If the entity has a music file
      if (entity.Music.length != 0) {
        entity.Music.map((music) => {
          musicTable.addRow(music.music_id);
        });
        extras += musicTable;
      }

      //If the entity has a sound file
      if (entity.Sounds.length != 0) {
        entity.Sounds.map((sound) => {
          soundTable.addRow(sound.sound_name);
        });
        extras += soundTable;
      }

      //If the entity has a localization
      if (entity.LocalizationTexts.length != 0) {
        entity.LocalizationTexts.map((localization) => {
          localizationTable.addRow(localization.localization_id, localization.localization_type);
        });
        extras += localizationTable;
      }
      const overhead = entityFields.reduce((n, f) => n + f.name.length + f.value.length + 3, 0);
      const budget = 1850 - overhead;

      const render = (imgCap: number, rowCap: number) => {
        let out = "";
        if (sections.has("Images") && entity.Images.length != 0) {
          const it = new AsciiTable3().setHeading("Filename","Path","Status").setAlignCenter(0).setStyle("unicode-mix");
          entity.Images.slice(0, imgCap).forEach((i) => it.addRow(i.filename, i.path, i.status));
          out += it.toString();
        }
        if (sections.has("Music") && entity.Music.length != 0) {
          const mt = new AsciiTable3().setHeading("Music_id").setAlignCenter(0).setStyle("unicode-mix");
          entity.Music.slice(0, rowCap).forEach((m) => mt.addRow(m.music_id));
          out += mt.toString();
        }
        if (sections.has("Sounds") && entity.Sounds.length != 0) {
          const st = new AsciiTable3().setHeading("Sound_id").setAlignCenter(0).setStyle("unicode-mix");
          entity.Sounds.slice(0, rowCap).forEach((x) => st.addRow(x.sound_name));
          out += st.toString();
        }
        if (sections.has("LocalizationTexts") && entity.LocalizationTexts.length != 0) {
          const lt = new AsciiTable3().setHeading("Localization_id","Localization_Type").setAlignCenter(0).setStyle("unicode-mix");
          entity.LocalizationTexts.slice(0, rowCap).forEach((l) => lt.addRow(l.localization_id, l.localization_type));
          out += lt.toString();
        }
        return out;
      };

      var body = render(entity.Images.length, Math.max(entity.Music.length, entity.Sounds.length, entity.LocalizationTexts.length, 1));
      if (body.length === 0)
        body = `no ${sections.size == SECTIONS.length ? "data" : sectionLabels(sections)} for this entity`;
      stringTable += body;
      stringTable += "```";

      const header = entityFields.map(field => `${field.name}: ${field.value}`).join("\n") + "\n";
      //Remove the unicode characters from the table cuz discord has a limit for horizontal characters
      const stripBorders = (row: string) => disableTable
        ? row.replace(/[║╔═╗╚╝╤╧╢╟]|─(?!.*─)/g, "")
        : row;

      const messages: string[] = [];
      let part = "";
      let limit = 1900 - header.length;
      for (const row of body.split("\n")) {
        const line = stripBorders(row);
        if (part.length > 0 && part.length + line.length + 8 > limit) {
          messages.push("```" + part + "```");
          part = "";
          limit = 1900;
        }
        part += line + "\n";
      }
      if (part.length > 0) messages.push("```" + part + "```");
      if (messages.length === 0) messages.push("```\n```");
      messages[0] = header + messages[0];

        /*
        ### FOR FUTURE REFERENCE ###
        Discord has a limit of 6000 characters per Embed
        In the very dubious and very questionable case that the table is longer than 6000 characters,
        you might want the bot to split the table in multiple Embeds
        i think, i'm not sure
        End report.
        ~ v
        */

      const components: APIActionRowComponent<APIComponentInMessageActionRow>[] = [];
      if (sections.has("Images")) {
        components.push(InfoButton(input.replaceAll(" ", "-")));
        if (HasImages) {
          components.push(ImageMenu(entity.Images));
          const pages = ImagePageCount(entity.Images);
          if (pages > 1) components.push(ImagePageButtons(input.replaceAll(" ", "-"), 0, pages));
        }
      }

    // Thank you discord for breaking the embeds
    //   const entityEmbed = new EmbedBuilder()
    //     .setColor('#23a55a')
    //     .setTitle(`${input}`)
    //     .addFields(entityFields)
    //     .toJSON();

      for (let i = 0; i < messages.length; i++) {
        if (messages[i].length <= 1990) continue;
        messages[i] = messages[i].slice(0, 1900);
        if (((messages[i].match(/```/g) || []).length) % 2 === 1) messages[i] += "\n```";
        messages[i] += "\n(output truncated)";
      }

      const content = messages[0];
      const overflow = messages.slice(1);
      const firstComponents = overflow.length == 0 ? components : [];

      if(message != null) {

        //if the message has a reply with images, remove it
        if(message.channel.type ==  ChannelType.GuildText) {
          var messageHasReference = await FetchMessageRef(message.channel, message.id, [], isImagePreview);
          if (messageHasReference != "") {
            var imageMessage = await message.channel.messages.fetch(messageHasReference);
            await imageMessage.delete();
          }
          if(interaction.isAnySelectMenu())
            await message.edit({content: content, components: firstComponents });
          else
            await message.delete();
        }

        //resolve the interaction request
        if(interaction.isAnySelectMenu()) {
          await interaction.update({components: [SearchMenu(interaction.component.options, input), interaction.message.components[1]]});
        }
        else
          await respond({content: content, components: firstComponents });
      }
      else await respond({content: content, components: firstComponents });

      for (let i = 0; i < overflow.length; i++)
        await interaction.followUp({ content: overflow[i], components: i == overflow.length - 1 ? components : [] });
    }
  }
  //IF the query returns no results
  else {
    const errorEmbed = new EmbedBuilder()
      .setColor('#D70022')
      .setTitle('Fail')
      .setDescription('There was no entry corresponding inside the database')
      .toJSON()
    await respond({ embeds: [errorEmbed] });
  }
}

export function sectionSuggestions(input: string) {
  const parts = input.split(',').map(part => part.trim()).filter(part => part != "");
  const names = (section: { label: string, value: string }) =>
    [section.label.toLowerCase(), section.value.toLowerCase()];

  const last = (parts.length == 0 ? "" : parts[parts.length - 1]).toLowerCase();
  const partial = SECTIONS.some(section => names(section).includes(last)) ? "" : last;

  const chosen = (partial == "" ? parts : parts.slice(0, -1)).map(part => part.toLowerCase());
  const picked = SECTIONS.filter(section =>
    chosen.some(part => names(section).includes(part)));

  const left = SECTIONS.filter(section => !picked.includes(section));
  var rest = left.filter(section => section.label.toLowerCase().startsWith(partial));
  if (rest.length == 0) rest = left;

  const suggestion = (sections: typeof SECTIONS) => ({
    name: sections.map(section => section.label).join(", "),
    value: sections.map(section => section.value).join(","),
  });

  const choices = picked.length != 0 ? [suggestion(picked)]
    : "all".startsWith(partial) ? [{ name: 'All', value: 'All' }]
    : [];
  for (const section of rest) choices.push(suggestion([...picked, section]));

  return choices.slice(0, 25);
}

/**
 * Implementation of the autocomplete feature.
 * @param {AutocompleteInteraction} interaction The istance of the interaction.
 */
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused(true);
  const focusedValue = focused.value;

  if (focused.name == 'type') {
    await interaction.respond(sectionSuggestions(focusedValue));
    return;
  }

  var names;
  var choices: string[];

  if (focused.name == 'internal_name') {
    names = await prisma.internalNames.findMany({
      select: {
        internal_name: true
      }
    });
    choices = fuzzysort.go(focusedValue, names, { key: 'internal_name' }).map(({ obj }) => obj.internal_name);
  }
  else {
    names = await prisma.entity.findMany({
      select: {
        name: true
      }
    });
    choices = fuzzysort.go(focusedValue, names, { key: 'name' }).map(({ obj }) => obj.name);
  }

  const filteredArray = choices.slice(0, 25);

  await interaction.respond(
    filteredArray.map(choice => ({ name: choice, value: choice })),
  );
}
