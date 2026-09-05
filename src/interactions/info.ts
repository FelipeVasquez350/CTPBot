import { ButtonInteraction, ChannelType, PartialGroupDMChannel, StringSelectMenuInteraction } from "discord.js";
import { ImageMenu, ImagePageButtons, ImagePageCount, InfoButton } from "../components";
import { FetchMessageRef, isImagePreview } from "../utils/fetch_message_reference";
import prisma from "../prisma";
import archiver from "archiver";
import config from "../config";
import fs from "fs";

const previewMessages = new Map<string, string>();

export async function Select(interaction: StringSelectMenuInteraction) {

  const channel = interaction.message.channel;
  if (channel.type != ChannelType.GuildText) return;

  const images = interaction.values;

  const files: { attachment: string; }[] = []
  images.map((image) => { 
    var [fileName, path] = image.split(", ");
    files.push({attachment: `archive/Content/${path}/${fileName}.png`})
  });

  const rows = interaction.message.components;
  const refreshed = [rows[0], ImageMenu(interaction.component.options, images), ...rows.slice(2)];

  const previousId = previewMessages.get(interaction.message.id)
    || await FetchMessageRef(channel, interaction.message.id, [], isImagePreview);

  if (previousId) {
    previewMessages.delete(interaction.message.id);
    await channel.messages.fetch(previousId)
      .then(previous => previous.delete())
      .catch(error => console.log("Could not remove the previous preview: " + error.message));
  }

  await interaction.update({ components: refreshed });

  if (files.length == 0) return;

  const preview = await interaction.followUp({ files: files });
  if (previewMessages.size > 500) previewMessages.delete(previewMessages.keys().next().value!);
  previewMessages.set(interaction.message.id, preview.id);
}

export async function ImagePage(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');
  const entity = parts.slice(3).join('_');
  const name = entity.replaceAll('-', ' ');

  const images = await prisma.images.findMany({
    where: { InternalName: { OR: [{ name: name }, { internal_name: name }] } },
    orderBy: { image_id: 'asc' }
  });

  const pages = ImagePageCount(images);
  const page = Math.min(Math.max(0, Number(parts[2])), pages - 1);

  await interaction.update({ components: [
    InfoButton(entity),
    ImageMenu(images, [], page),
    ImagePageButtons(entity, page, pages)
  ] });
}

async function fetchEntityImages(tag: string, file: string, input: string, ctp: boolean) {
  const result = await prisma.images.findMany({
    where: {
      InternalName: {
        OR: [
          {name: input.replaceAll("-", " ")},
          {internal_name: input.replaceAll("-", " ")}
        ]
      },
    },
    select: {
      filename: true,
      path: true,
      status: true
    }
  });

  const wanted = ctp ? result.filter(image => image.status == true) : result;
  const sources = wanted.map(image => ({
    name: `${image.filename}.png`,
    path: ctp
      ? `archive/Content/${image.path}/${image.filename}.png`
      : `${config.VANILLA_FILES_PATH}/${image.path}/${image.filename}.png`,
  }));

  const present = sources.filter(source => fs.existsSync(source.path));
  for (const source of sources.filter(source => !present.includes(source)))
    console.log(`${tag} source missing from disk: ${source.path}`);
  if (present.length == 0) return null;

  const zip = fs.createWriteStream(file);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  const written = new Promise<void>((resolve, reject) => {
    zip.on("close", resolve);
    zip.on("error", reject);
    archive.on("error", reject);
  });

  var archived = 0;
  archive.on("entry", () => archived++);
  archive.on("warning", warning => console.log(`${tag} ${warning.code}: ${warning.message}`));

  archive.pipe(zip);
  for (const source of present) archive.file(source.path, { name: source.name });
  await archive.finalize();
  await written;

  if (archived == 0) {
    console.log(`${tag} every source was dropped, nothing to send`);
    await fs.promises.rm(file, { force: true });
    return null;
  }

  return { archived: archived, dropped: sources.length - archived, bytes: archive.pointer() };
}

async function deleteUnnecessaryFiles(interaction: ButtonInteraction, ctp: boolean) {
  const channel = interaction.message.channel;
  if (channel instanceof PartialGroupDMChannel) return;

  let skipId: string[] = [];
  let ref = await FetchMessageRef(channel, interaction.message.id);

  while (ref != "") {
    const message = await channel.messages.fetch(ref);
    const isStaleZip = message.content == '' && message.attachments.some(
      attachment => attachment.contentType == "application/zip"
        && (ctp ? attachment.name.includes("ctp") : attachment.name.includes("vanilla"))
    );

    if (isStaleZip) await message.delete();
    else skipId.push(message.id);

    ref = await FetchMessageRef(channel, interaction.message.id, skipId);
  }
}

async function download(interaction: ButtonInteraction, ctp: boolean) {
  const entity = interaction.customId.split('_').slice(2).join('_');
  const kind = ctp ? "ctp" : "vanilla";
  const tag = `[download ${interaction.id}]`;
  const started = Date.now();

  console.log(`${tag} ${kind} ${entity} for ${interaction.user.tag} (${interaction.user.id})`
    + ` in ${interaction.guild?.name ?? "a dm"}#${interaction.channelId}`);

  await interaction.deferReply();

  await deleteUnnecessaryFiles(interaction, ctp);

  const file = `archive/${interaction.id}_${entity}_${kind}.zip`;
  const zip = await fetchEntityImages(tag, file, entity, ctp);

  if (zip == null) {
    console.log(`${tag} no images to send (${Date.now() - started}ms)`);
    await interaction.editReply({ content: `No images found for ${entity}` });
    return;
  }

  if (zip.dropped != 0)
    console.log(`${tag} ${zip.dropped} of ${zip.archived + zip.dropped} images could not be read`);

  try {
    await interaction.editReply({ files: [{ attachment: file, name: `${entity}_${kind}.zip` }] });
    console.log(`${tag} sent ${zip.archived} images, ${zip.bytes} bytes (${Date.now() - started}ms)`);
  }
  finally {
    await fs.promises.rm(file, { force: true });
  }
}

export async function DownloadCTP(interaction: ButtonInteraction) {
  await download(interaction, true);
}

export async function DownloadVanilla(interaction: ButtonInteraction) {
  await download(interaction, false);
}