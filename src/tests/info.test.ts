import { execute, parseSections, sectionSuggestions } from "../commands/info";
import dotenv from 'dotenv';
dotenv.config();

test("Info command", async () => {
  const interaction = {
    deferred: false,
    replied: false,
    options: {
      data: [
        {
          value: "Doctor Bones"
        }
      ],
      get(option: string) {
        return option == "name" ? { value: "Doctor Bones" } : undefined;
      }
    },
    isCommand() { return true; },
    isButton() { return false; },
    isAnySelectMenu() { return false; },
    deferReply: jest.fn(async () => { interaction.deferred = true; }),
    editReply: jest.fn(),
    followUp: jest.fn()
  };
  //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.editReply).toHaveBeenCalledWith({
    content: "Name: Doctor Bones\nInternalName: DoctorBones\n```╔══════════╤════════╤════════╗\n║ Filename │  Path  │ Status ║\n╟──────────┼────────┼────────╢\n║ NPC_52   │ Images │ false  ║\n║ Gore_3   │ Images │ true   ║\n║ Gore_4   │ Images │ true   ║\n║ Gore_5   │ Images │ true   ║\n╚══════════╧════════╧════════╝\n\n```",
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Download CTP",
            style: 3,
            custom_id: "Info_DownloadCTP_Doctor-Bones"
          },
          {
            type: 2,
            label: "Download Vanilla",
            style: 2,
            custom_id: "Info_DownloadVanilla_Doctor-Bones"
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "Info_Select",
            placeholder: "Select up to 3 images to show.",
            min_values: 0,
            max_values: 3,
            options: [
              {
                label: "Gore_3",
                value: "Gore_3, Images",
                description: "Gore | Images | 26x30"
              },
              {
                label: "Gore_4",
                value: "Gore_4, Images",
                description: "Gore | Images | 22x14"
              },
              {
                label: "Gore_5",
                value: "Gore_5, Images",
                description: "Gore | Images | 22x20"
              }
            ]
          }
        ]
      }
    ]
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
