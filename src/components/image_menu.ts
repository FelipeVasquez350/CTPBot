import { Images } from '.prisma/client';
import { ActionRowBuilder, APISelectMenuOption, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

function areImages(value: Images[] | APISelectMenuOption[]): value is Images[] {
  return (value as Images[])[0].status !== undefined ;
}

function isAPISelectMenuOption(value: (StringSelectMenuOptionBuilder | APISelectMenuOption)[]): value is APISelectMenuOption[] {
  return (value as APISelectMenuOption[])[0].label !== undefined;
}

function areOptionsTheSame(stringOptions: APISelectMenuOption[], value: Images) {
  for(var option of stringOptions) {
    if(option.label == value.filename && option.description == `${value.type} | ${value.path} | ${value.width}x${value.height}`)
      return true;
  }
}

function ImageMenu(values: Images[] | APISelectMenuOption[], currentOptions: string[] = []) {
  var stringOptions: (StringSelectMenuOptionBuilder | APISelectMenuOption)[] = [];

  if (areImages(values)) {
    for (const value of values) {
      if (value.status == true) {
        if (stringOptions.length >0 && isAPISelectMenuOption(stringOptions) && areOptionsTheSame(stringOptions, value)) {
          continue;
        }
        stringOptions.push({
          label: value.filename!,
          description: `${value.type} | ${value.path} | ${value.width}x${value.height}`,
          value: `${value.filename}, ${value.path}`
        });
      }
    }
  }
  else { 
    values.map((value) => {
      if(currentOptions.includes(value.value) && currentOptions.length != 0) 
        value.default = true;
      else
        value.default = false;
        
    })
    stringOptions = values;
  } 
  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('Info_Select')
        .setPlaceholder('Select up to 3 images to show.')
        .setMinValues(0)
        .setMaxValues(stringOptions.length >= 3 ? 3 : stringOptions.length)
        .addOptions(stringOptions)
    )
    .toJSON();
}
 
export default ImageMenu;