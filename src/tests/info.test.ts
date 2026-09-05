import { execute, parseSections, sectionSuggestions } from "../commands/info";
import dotenv from 'dotenv';
dotenv.config();

test("Info command", async () => {
  const interaction = {
    options: {
      data: [
        {
          value: "Doctor Bones"
        }
      ]
    },
    isCommand() { return true; },
    reply: jest.fn()
  };
    //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({
    components:  [
      {
        components:  [
          {
            custom_id: "Info_DownloadCTP_Doctor-Bones",
            emoji: undefined,
            label: "Download CTP",
            style: 3,
            type: 2,
          },
          {
            custom_id: "Info_DownloadVanilla_Doctor-Bones",
            emoji: undefined,
            label: "Download Vanilla",
            style: 2,
            type: 2,
          },
        ],
        type: 1,
      },
    ],
    embeds:  [
      {
        color: 2336090,
        fields:  [
          {
            inline: true,
            name: "Name",
            value: "Doctor Bones"
          },
          {
            inline: true,
            name: "InternalName",
            value: "DoctorBones"
          },
          {
            inline: false,
            name: "Data",
            value: "```╔══════════╤════════╤════════╗\n║ Filename │  Path  │ Status ║\n╟──────────┼────────┼────────╢\n║ NPC_52   │ Images │ false  ║\n║ Gore_3   │ Images │ false  ║\n║ Gore_4   │ Images │ false  ║\n║ Gore_5   │ Images │ false  ║\n╚══════════╧════════╧════════╝\n```",
          }
        ],
        title: "Doctor Bones",
      },
    ],   
  });
});
test("Type option parses several tables", () => {
  expect([...parseSections("")]).toEqual(["Images"]);
  expect([...parseSections("Statues")]).toEqual(["Images"]);
  expect([...parseSections("All")]).toEqual(["Images", "Sounds", "Music", "LocalizationTexts"]);
  expect([...parseSections("all")]).toEqual(["Images", "Sounds", "Music", "LocalizationTexts"]);

  expect([...parseSections("Images")]).toEqual(["Images"]);
  expect([...parseSections("Images,Sounds")]).toEqual(["Images", "Sounds"]);
  expect([...parseSections(" images , LOCALIZATIONS ")]).toEqual(["Images", "LocalizationTexts"]);
  expect([...parseSections("LocalizationTexts")]).toEqual(["LocalizationTexts"]);
  expect([...parseSections("Music,Music")]).toEqual(["Music"]);
});

test("Type option suggestions accumulate", () => {
  expect(sectionSuggestions("")).toEqual([
    { name: "All", value: "All" },
    { name: "Images", value: "Images" },
    { name: "Sounds", value: "Sounds" },
    { name: "Music", value: "Music" },
    { name: "Localizations", value: "LocalizationTexts" },
  ]);

  expect(sectionSuggestions("a")[0]).toEqual({ name: "All", value: "All" });
  expect(sectionSuggestions("so")).toEqual([{ name: "Sounds", value: "Sounds" }]);

  expect(sectionSuggestions("Images")).toEqual([
    { name: "Images", value: "Images" },
    { name: "Images, Sounds", value: "Images,Sounds" },
    { name: "Images, Music", value: "Images,Music" },
    { name: "Images, Localizations", value: "Images,LocalizationTexts" },
  ]);

  expect(sectionSuggestions("Images,mu")).toEqual([
    { name: "Images", value: "Images" },
    { name: "Images, Music", value: "Images,Music" },
  ]);

  expect(sectionSuggestions("Images,Sounds,Music,LocalizationTexts")).toEqual([
    { name: "Images, Sounds, Music, Localizations", value: "Images,Sounds,Music,LocalizationTexts" },
  ]);

  expect(sectionSuggestions("Images,zzz").length).toBe(4);
});
