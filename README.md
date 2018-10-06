# Sticker Time Bot
Telegram Link: [http://t.me/sticker_time_bot](http://t.me/sticker_time_bot)

## Introduction
This is a [Telegram](https://telegram.org/) bot sending a sticker telling time every hour. You can start or stop any time using commands.

## Commands
**Start sending stickers:** `/start`

**Stop sending stickers:** `/stop`

## Environment
- Node.js 8.0+

## Installation
```sh
npm install
```

## Configuration
Create a file config.json:
```json
{
    "tg_bot_token": "Your Telegram bot token here",
    "log_file": "Log file"
}
```

## Start
```sh
npm start
```