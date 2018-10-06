const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const fs = require('fs');

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

if (typeof data == 'undefined' || data == null ||
    typeof data.chatids == 'undefined' || data.chatids == null) {
    logger.info('No data.json');
    var data = {
        chatids: []
    };
    saveData();
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (data.chatids.includes(chatId)) {
        bot.sendMessage(chatId, 'Already started, chat ID: ' + chatId);
        return;
    }
    data.chatids.push(chatId);
    saveData();
    logger.info(chatId + ' started');
    bot.sendMessage(chatId, 'Started, chat ID: ' + chatId);
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

var CronJob = require('cron').CronJob;
var cron = new CronJob('0 * * * *', function() {
    var date = new Date();
    logger.info('Cron triggered: ' + date + ', send sticker to ' + data.chatids.length + ' chats');
    var hour = date.getHours();
    hour = (hour + 8) % 12;
    data.chatids.forEach(function (id) {
        bot.sendSticker(id, stickers[hour]);
    });
}, null, true, 'Asia/Shanghai');
