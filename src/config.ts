import dotenv from 'dotenv';
dotenv.config();

const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN, DATABASE_URL, VANILLA_FILES_PATH } = process.env;

if(!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN || !DATABASE_URL || !VANILLA_FILES_PATH ) {
  throw new Error('Missing config');
}

const config: Record<string, string> = {
  CLIENT_ID,
  GUILD_ID,
  DISCORD_TOKEN,
  DATABASE_URL,
  VANILLA_FILES_PATH
}

export default config;