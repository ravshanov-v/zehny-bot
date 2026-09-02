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

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🎮 Qiziqarli sinovlar'],
      ['📚 Maktab fanlari'],
      ['🌐 Tillar'],
      ["💻 IT yo'nalishlari"]
    ],
    resize_keyboard: true
  }
};

const funMenu = {
  reply_markup: {
    keyboard: [
      ['⚽ Sport sinovi', '🎬 Kino-Musiqa sinovi'],
      ['💡 Fakt sinovi', '💻 Texnologiya sinovi'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

const schoolMenu = {
  reply_markup: {
    keyboard: [
      ['📜 Tarix sinovi', '➗ Matematika sinovi'],
      ['⚛️ Fizika sinovi', '🧪 Kimyo sinovi'],
      ['🧬 Biologiya sinovi', '📖 Adabiyot sinovi'],
      ['✍️ Ona tili sinovi'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

const tarixLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 5-7 sinf'],
      ['🟡 7-9 sinf', '🔴 9-11 sinf'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const languagesMenu = {
  reply_markup: {
    keyboard: [
      ['🇬🇧 Ingliz tili'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

const inglizMenu = {
  reply_markup: {
    keyboard: [
      ['🔤 Umumiy sinov'],
      ['🎯 CEFR darajasini bilib olish'],
      ['⬅️ Tillarga qaytish']
    ],
    resize_keyboard: true
  }
};

const cefrLevelMenu = {
  reply_markup: {
    keyboard: [
      ["🟢 A1-A2 (Boshlang'ich)"],
      ["🟡 B1-B2 (O'rta)", "🔴 C1-C2 (Yuqori)"],
      ['⬅️ Ingliz tiliga qaytish']
    ],
    resize_keyboard: true
  }
};

const itMenu = {
  reply_markup: {
    keyboard: [
      ['🎨 Frontend sinovi', '⚙️ Backend sinovi'],
      ['📱 Mobil dasturlash sinovi', '📊 Data Science sinovi'],
      ['🤖 AI/ML sinovi', '🔒 Kiberxavfsizlik sinovi'],
      ['🎨 UI/UX Dizayn sinovi', '🌐 Tarmoqlar sinovi'],
      ["🗄️ Ma'lumotlar bazasi sinovi", '🦾 Robototexnika sinovi'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Salom! Men *Zehnly* botman 🤖\nQaysi guruhdan boshlaymiz?", {
    ...mainMenu,
    parse_mode: 'Markdown'
  });
});

const mavzular = {
  '⚽ Sport sinovi': { key: 'sport', nom: 'Sport sinovi' },
  '🎬 Kino-Musiqa sinovi': { key: 'kino', nom: 'Kino-Musiqa sinovi' },
  '💡 Fakt sinovi': { key: 'faktlar', nom: 'Fakt sinovi' },
  '💻 Texnologiya sinovi': { key: 'texnologiya', nom: 'Texnologiya sinovi' },
  '🔤 Umumiy sinov': { key: 'ingliz', nom: 'Ingliz tili umumiy sinovi' },
  '🟢 5-7 sinf': { key: 'tarix_5_7', nom: 'Tarix sinovi (5-7 sinf)' },
  "🟢 A1-A2 (Boshlang'ich)": { key: 'cefr_a1_a2', nom: 'Ingliz tili CEFR sinovi' }
};

const tayyorEmasMavzular = [
  '➗ Matematika sinovi', '⚛️ Fizika sinovi', '🧪 Kimyo sinovi', '🧬 Biologiya sinovi',
  '📖 Adabiyot sinovi', '✍️ Ona tili sinovi',
  '🟡 7-9 sinf', '🔴 9-11 sinf', "🟡 B1-B2 (O'rta)", "🔴 C1-C2 (Yuqori)",
  '🎨 Frontend sinovi', '⚙️ Backend sinovi', '📱 Mobil dasturlash sinovi', '📊 Data Science sinovi',
  '🤖 AI/ML sinovi', '🔒 Kiberxavfsizlik sinovi', '🎨 UI/UX Dizayn sinovi', '🌐 Tarmoqlar sinovi',
  "🗄️ Ma'lumotlar bazasi sinovi", '🦾 Robototexnika sinovi'
];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🎮 Qiziqarli sinovlar') {
    bot.sendMessage(chatId, "Qaysi mavzuni tanlaysiz?", funMenu);
    return;
  }

  if (text === '📚 Maktab fanlari') {
    bot.sendMessage(chatId, "Qaysi fanni tanlaysiz?", schoolMenu);
    return;
  }

  if (text === "🌐 Tillar") {
    bot.sendMessage(chatId, "Qaysi tilni tanlaysiz?", languagesMenu);
    return;
  }

  if (text === "💻 IT yo'nalishlari") {
    bot.sendMessage(chatId, "Qaysi IT yo'nalishini tanlaysiz?", itMenu);
    return;
  }

  if (text === '📜 Tarix sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", tarixLevelMenu);
    return;
  }

  if (text === '🇬🇧 Ingliz tili') {
    bot.sendMessage(chatId, "Qaysi turdagi sinovni xohlaysiz?", inglizMenu);
    return;
  }

  if (text === '🎯 CEFR darajasini bilib olish') {
    bot.sendMessage(chatId, "Qaysi daraja guruhini sinab ko'rasiz?\n\n⚠️ Eslatma: bu taxminiy natija, rasmiy sertifikat emas.", cefrLevelMenu);
    return;
  }

  if (text === '⬅️ Orqaga') {
    bot.sendMessage(chatId, "Bosh menyu:", mainMenu);
    return;
  }

  if (text === '⬅️ Fanga qaytish') {
    bot.sendMessage(chatId, "Qaysi fanni tanlaysiz?", schoolMenu);
    return;
  }

  if (text === '⬅️ Tillarga qaytish') {
    bot.sendMessage(chatId, "Qaysi tilni tanlaysiz?", languagesMenu);
    return;
  }

  if (text === '⬅️ Ingliz tiliga qaytish') {
    bot.sendMessage(chatId, "Qaysi turdagi sinovni xohlaysiz?", inglizMenu);
    return;
  }

  if (tayyorEmasMavzular.includes(text)) {
    bot.sendMessage(chatId, "Bu bo'lim tez orada tayyor bo'ladi! 🔧");
    return;
  }

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
});

process.on('uncaughtException', (err) => {
  console.error('Kutilmagan xato (dastur davom etadi):', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Kutilmagan promise xatosi (dastur davom etadi):', err);
});

bot.on('polling_error', (err) => {
  console.error('Polling xatosi (dastur davom etadi):', err.message);
});

console.log("Bot ishga tushdi...");
