import { execute } from "../commands/info";
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