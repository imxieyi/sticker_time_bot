const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const fs = require('fs');
const moment = require('moment-timezone');
const CronJob = require('cron').CronJob;

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: config.log_file })
    ]
});

const token = config.tg_bot_token;

const stickers = [
    'CAADBQAD8wADDxXNGeYW5EDuT_6aAg',
    'CAADBQAD9AADDxXNGcJK3qzks8qLAg',
    'CAADBQAD9QADDxXNGZ6Uniz2IyF3Ag',
    'CAADBQAD9gADDxXNGRLp93L7_gSLAg',
    'CAADBQAD9wADDxXNGRU9qwR8J2NjAg',
    'CAADBQAD-AADDxXNGYQQoarLCyyeAg',
    'CAADBQAD-QADDxXNGe5M6q3FOIs_Ag',
    'CAADBQAD-gADDxXNGYlJ7FZM6M4rAg',
    'CAADBQAD-wADDxXNGe8aqxEu9OCLAg',
    'CAADBQAD_AADDxXNGSb44I6FN-UzAg',
    'CAADBQAD_QADDxXNGYGYV17DXBbkAg',
    'CAADBQAD_gADDxXNGWuj_Z6psGN4Ag'
];

const bot = new TelegramBot(token, { polling: true });

if (fs.existsSync('./data.json')) {
    var fdata = fs.readFileSync('./data.json', 'utf8');
    var data = JSON.parse(fdata);
    logger.info('Old data: ' + JSON.stringify(data));
}

function saveData() {
    json = JSON.stringify(data);
    fs.writeFile('./data.json', json, 'utf8');
}

if (typeof data == 'undefined' || data == null) {
    logger.info('No data.json');
    var data = {
        chatids: [],
        tzmap: {}
    };
    saveData();
}

if (typeof data.chatids == 'undefined' || data.chatids == null) {
    data.chatids = [];
    saveData();
}

if (typeof data.tzmap == 'undefined' || data.tzmap == null) {
    data.tzmap = {};
    saveData();
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    let index = data.chatids.indexOf(chatId);
    if (index > -1) {
        bot.sendMessage(chatId, 'Already started, chat ID: ' + chatId);
        return;
    }
    data.chatids.push(chatId);
    saveData();
    logger.info(chatId + ' started');
    bot.sendMessage(chatId, 'Started, chat ID: ' + chatId);
});

bot.onText(/^\/timezone(@sticker_time_bot)?(\s+([^\s]+))?$/, (msg, match) => {
    const chatId = msg.chat.id;
    if (match[3]) {
        if (moment.tz.zone(match[3])) {
            logger.info(chatId + ' set timezone to ' + match[3]);
            bot.sendMessage(chatId, 'Set timezone to ' + match[3]);
            data.tzmap[chatId] = match[3];
            saveData();
        } else {
            bot.sendMessage(chatId, 'Invalid timezone: ' + match[3]);
        }
    } else {
        let tz = data.tzmap[chatId];
        if (tz) {
            bot.sendMessage(chatId, 'Current timezone: ' + data.tzmap[chatId]);
        } else {
            bot.sendMessage(chatId, 'Timezone not set, by default Asia/Shanghai.');
        }
    }
});

bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    let index = data.chatids.indexOf(chatId);
    if (index > -1) {
        data.chatids.splice(index, 1);
        saveData();
    } else {
        bot.sendMessage(chatId, 'Not started, chat ID: ' + chatId);
        return;
    }
    logger.info(chatId + ' stopped');
    bot.sendMessage(chatId, 'Stopped, chat ID: ' + chatId);
});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
});

// bot.on('sticker', (msg) => {
    // const chatId = msg.chat.id;
    // logger.info('[' + chatId + '] ' + msg.sticker.file_id);
// });

bot.on('polling_error', (error) => {
  logger.error(error);  // => 'EFATAL'
});

var cron = new CronJob('0 * * * *', function() {
    var date = new Date();
    logger.info('Cron triggered: ' + date + ', send sticker to ' + data.chatids.length + ' chats');
    data.chatids.forEach(function (id) {
        let tz = data.tzmap[id];
        if (!tz) {
            tz = 'Asia/Shanghai';
        }
        let hour = moment().tz(tz).hours();
        bot.sendSticker(id, stickers[hour % 12]);
    });
}, null, true, 'Asia/Shanghai');
