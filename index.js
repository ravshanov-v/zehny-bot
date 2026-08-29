require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Zehnly bot ishlayapti! 🤖');
});

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const MINI_APP_URL = 'https://ravshanov-v.github.io/zehnly-app/';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['⚽ Sport sinovi', '🎬 Kino-Musiqa sinovi'],
        ['💡 Fakt sinovi', '💻 Texnologiya sinovi']
      ],
      resize_keyboard: true
    }
  };
  bot.sendMessage(chatId, "Salom! Men *Zehnly* botman 🤖\nQaysi mavzudan viktorina o'ynashni xohlaysiz?", {
    ...options,
    parse_mode: 'Markdown'
  });
});

const mavzular = {
  '⚽ Sport sinovi': { key: 'sport', nom: 'Sport sinovi' },
  '🎬 Kino-Musiqa sinovi': { key: 'kino', nom: 'Kino-Musiqa sinovi' },
  '💡 Fakt sinovi': { key: 'faktlar', nom: 'Fakt sinovi' },
  '💻 Texnologiya sinovi': { key: 'texnologiya', nom: 'Texnologiya sinovi' }
};

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (mavzular[text]) {
    const { key, nom } = mavzular[text];
    bot.sendMessage(chatId, `${nom} boshlanmoqda 👇`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: `${nom}ni boshlash`, web_app: { url: `${MINI_APP_URL}?mavzu=${key}&t=${Date.now()}` } }]
        ]
      }
    });
    return;
  }

  if (msg.web_app_data) {
    const data = JSON.parse(msg.web_app_data.data);
    bot.sendMessage(chatId, `🏁 Natijangiz saqlandi: ${data.ball}/${data.jami} ✅`);
  }
});

console.log("Bot ishga tushdi...");
process.on('uncaughtException', (err) => {
  console.error('Kutilmagan xato (dastur davom etadi):', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Kutilmagan promise xatosi (dastur davom etadi):', err);
});

bot.on('polling_error', (err) => {
  console.error('Polling xatosi (dastur davom etadi):', err.message);
});
