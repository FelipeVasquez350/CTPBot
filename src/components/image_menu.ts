import { Images } from '../generated/prisma/client';
import { ActionRowBuilder, APISelectMenuOption, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

export const IMAGES_PER_PAGE = 25;

function areImages(value: Images[] | APISelectMenuOption[]): value is Images[] {
  return (value as Images[])[0].status !== undefined ;
}

export function ImageOptions(images: Images[]): APISelectMenuOption[] {
  const options: APISelectMenuOption[] = [];
  for (const image of images) {
    if (image.status != true) continue;
    const description = `${image.type} | ${image.path} | ${image.width}x${image.height}`;
    if (options.some(option => option.label == image.filename && option.description == description)) continue;
    options.push({ label: image.filename!, description: description, value: `${image.filename}, ${image.path}` });
  }
  return options;
}

export function ImagePageCount(images: Images[]) {
  return Math.max(1, Math.ceil(ImageOptions(images).length / IMAGES_PER_PAGE));
}

function ImageMenu(values: Images[] | APISelectMenuOption[], currentOptions: string[] = [], page: number = 0) {
  var stringOptions: (StringSelectMenuOptionBuilder | APISelectMenuOption)[] = [];

  if (areImages(values)) {
    stringOptions = ImageOptions(values).slice(page * IMAGES_PER_PAGE, page * IMAGES_PER_PAGE + IMAGES_PER_PAGE);
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
