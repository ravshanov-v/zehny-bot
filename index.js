require('dotenv').config();
const express = require('express');
const fs = require('fs').promises; // Asinxron fayl tizimi
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

// ==== TAKLIF TUGMASI UCHUN ====
const awaitingSuggestion = new Set();
const ADMIN_CHAT_ID = 7483038020; // Admin Telegram Chat ID

const suggestionBuffers = new Map();
const SUGGESTION_DEBOUNCE_MS = 1200; 
const FORWARD_DELAY_MS = 350; 

const fallbackTimers = new Map();
const FALLBACK_DEBOUNCE_MS = 800;

// Forward qilingan xabar ID si va asl yuboruvchi ID sini bog'lab turuvchi Map
const adminForwardMap = new Map();

function forwardSequentially(chatId, messageIds, index, forwardedMsgIds = [], onComplete) {
  if (index >= messageIds.length) {
    onComplete(forwardedMsgIds);
    return;
  }
  bot.forwardMessage(ADMIN_CHAT_ID, chatId, messageIds[index])
    .then((fwdMsg) => {
      forwardedMsgIds.push(fwdMsg.message_id);
      adminForwardMap.set(fwdMsg.message_id, chatId);
    })
    .catch((err) => {
      console.error(`Forward qilishda xato (message_id=${messageIds[index]}):`, err.message);
    })
    .finally(() => {
      setTimeout(() => forwardSequentially(chatId, messageIds, index + 1, forwardedMsgIds, onComplete), FORWARD_DELAY_MS);
    });
}

function finalizeSuggestion(chatId, fromObj, messageIds) {
  suggestionBuffers.delete(chatId);
  awaitingSuggestion.delete(chatId);

  const count = messageIds.length;
  const userName = buildDisplayName(fromObj);
  const usernameLabel = fromObj.username ? `@${fromObj.username}` : "username yo'q";

  forwardSequentially(chatId, messageIds, 0, [], (forwardedMsgIds) => {
    const nechtaXabar = count > 1 ? `\n📦 Yuborilgan xabarlar/media soni: ${count} ta` : '';
    
    const lastForwardId = forwardedMsgIds.length > 0 ? forwardedMsgIds[forwardedMsgIds.length - 1] : null;
    const options = lastForwardId ? { reply_to_message_id: lastForwardId } : {};

    bot.sendMessage(
      ADMIN_CHAT_ID,
      `📩 **Yangi taklif!**\n\n👤 **Ism:** ${userName}\n🔗 **Username:** ${usernameLabel}\n🆔 **ID:** \`${chatId}\`\n🕒 **Vaqt:** ${new Date().toLocaleString('uz-UZ')}${nechtaXabar}\n\n💬 _Ushbu taklifga javob berish uchun shu xabarga yoki yuqoridagi forward qilingan xabarga Reply (Ответить) qiling._`,
      { parse_mode: 'Markdown', ...options }
    ).then((adminInfoMsg) => {
      adminForwardMap.set(adminInfoMsg.message_id, chatId);
    }).catch(() => {});

    bot.sendMessage(chatId, "✅ Rahmat! Taklifingiz qabul qilindi.", mainMenu).catch(() => {});
  });
}

// ==== ADMIN REPLYSINI USHLASH (ADMIN FOYDALANUVCHIGA JAVOB YOZGANDA) ====
bot.on('message', (msg) => {
  if (msg.chat.id === ADMIN_CHAT_ID && msg.reply_to_message) {
    const replyTo = msg.reply_to_message;
    let targetUserId = null;

    if (adminForwardMap.has(replyTo.message_id)) {
      targetUserId = adminForwardMap.get(replyTo.message_id);
    }

    if (!targetUserId && (replyTo.text || replyTo.caption)) {
      const textContent = replyTo.text || replyTo.caption;
      const match = textContent.match(/🆔 \*\*ID:\*\* `?(\d+)`?/i) || textContent.match(/ID: (\d+)/i);
      if (match && match[1]) {
        targetUserId = match[1];
      }
    }

    if (!targetUserId && replyTo.forward_from) {
      targetUserId = replyTo.forward_from.id;
    }

    if (targetUserId) {
      if (msg.text) {
        bot.sendMessage(
          targetUserId,
          `💬 **Admindan javob:**\n\n${msg.text}`,
          { parse_mode: 'Markdown' }
        ).then(() => {
          bot.sendMessage(ADMIN_CHAT_ID, "✅ Javobingiz foydalanuvchiga yetkazildi!");
        }).catch((err) => {
          bot.sendMessage(ADMIN_CHAT_ID, `❌ Javob yuborishda xatolik (foydalanuvchi botni bloklagan bo'lishi mumkin): ${err.message}`);
        });
      } else {
        bot.copyMessage(targetUserId, ADMIN_CHAT_ID, msg.message_id)
          .then(() => {
            bot.sendMessage(ADMIN_CHAT_ID, "✅ Javobingiz foydalanuvchiga yetkazildi!");
          })
          .catch((err) => {
            bot.sendMessage(ADMIN_CHAT_ID, `❌ Xatolik: ${err.message}`);
          });
      }
    }
  }
});

// ==== REFERAL VA STATISTIKA TIZIMI ====
const USERS_FILE = './users.json';
const REFERRAL_BONUS_THRESHOLD = 3; 

let botUsername = null; 

async function loadUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {}; 
  }
}

async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('users.json ga yozishda xato:', err.message);
  }
}

function buildDisplayName(fromObj) {
  const first = fromObj.first_name || '';
  const last = fromObj.last_name || '';
  const full = `${first} ${last}`.trim();
  return full || 'Foydalanuvchi';
}

async function registerUser(chatId, referrerId, newUserInfo) {
  const users = await loadUsers();
  const chatIdStr = String(chatId);

  if (users[chatIdStr]) {
    // Profil ma'lumotlarini yangilab qo'yamiz
    users[chatIdStr].name = newUserInfo.name;
    users[chatIdStr].username = newUserInfo.username;
    await saveUsers(users);
    return { isNew: false, referrerReachedBonus: false };
  }

  users[chatIdStr] = {
    name: newUserInfo.name,
    username: newUserInfo.username,
    referredBy: referrerId ? String(referrerId) : null,
    referralCount: 0,
    referredUsers: [], 
    joinedAt: new Date().toISOString(),
  };

  let referrerReachedBonus = false;

  if (referrerId && referrerId !== chatIdStr && users[String(referrerId)]) {
    const referrer = users[String(referrerId)];
    referrer.referralCount += 1;

    if (!Array.isArray(referrer.referredUsers)) {
      referrer.referredUsers = [];
    }

    referrer.referredUsers.push({
      chatId: chatIdStr,
      name: newUserInfo ? newUserInfo.name : 'Foydalanuvchi',
      username: newUserInfo && newUserInfo.username ? newUserInfo.username : null,
      joinedAt: new Date().toISOString(),
    });

    if (referrer.referralCount === REFERRAL_BONUS_THRESHOLD) {
      referrerReachedBonus = true;
    }
  }

  await saveUsers(users);
  return { isNew: true, referrerReachedBonus, referrerId };
}

async function getReferralCount(chatId) {
  const users = await loadUsers();
  const user = users[String(chatId)];
  return user ? user.referralCount : 0;
}

async function getReferredUsersList(chatId) {
  const users = await loadUsers();
  const user = users[String(chatId)];
  if (!user || !Array.isArray(user.referredUsers)) return [];
  return [...user.referredUsers].reverse();
}

function getReferralLink(chatId) {
  const uname = botUsername || 'YourBotUsername';
  return `https://t.me/${uname}?start=ref_${chatId}`;
}

// ==== ADMIN BUYRUQLARI (STATISTIKA VA FOYDALANUVCHILARNI KO'RISH) ====
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== ADMIN_CHAT_ID) return;

  const users = await loadUsers();
  const userIds = Object.keys(users);
  const totalUsers = userIds.length;

  let totalReferrals = 0;
  userIds.forEach(id => {
    totalReferrals += users[id].referralCount || 0;
  });

  const statsText = `📊 **Zehnly Bot Statistikasi:**\n\n` +
                    `👥 **Jami foydalanuvchilar:** ${totalUsers} kishi\n` +
                    `🔗 **Jami taklif qilinganlar:** ${totalReferrals} kishi`;

  bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
});

bot.onText(/\/users/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== ADMIN_CHAT_ID) return;

  const users = await loadUsers();
  const userIds = Object.keys(users);

  if (userIds.length === 0) {
    bot.sendMessage(chatId, "Hali hech qanday foydalanuvchi ro'yxatdan o'tmagan.");
    return;
  }

  // Oxirgi qo'shilgan 20 ta foydalanuvchi
  const lastUsers = userIds.slice(-20).reverse();
  
  let userListText = `👥 **Oxirgi 20 ta foydalanuvchi ro'yxati:**\n\n`;

  lastUsers.forEach((id, index) => {
    const u = users[id];
    const joinedDate = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('uz-UZ') : 'Noma\'lum';
    const userLabel = u.username ? `${u.name} (${u.username})` : (u.name || 'Foydalanuvchi');
    userListText += `${index + 1}. ${userLabel}\n🆔 \`${id}\` | Takliflari: ${u.referralCount || 0} ta | Sana: ${joinedDate}\n\n`;
  });

  bot.sendMessage(chatId, userListText, { parse_mode: 'Markdown' });
});

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🎮 Qiziqarli sinovlar'],
      ['📚 Maktab fanlari'],
      ['🌐 Tillar'],
      ["💻 IT yo'nalishlari"],
      ['🎁 Do\'stlarni taklif qilish'],
      ['📝 Taklif bildirish']
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
      ['✍️ Ona tili sinovi', '🌍 Geografiya sinovi'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

const geografiyaLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Geografiya 5-7 sinf', '🟡 Geografiya 7-9 sinf'],
      ['🔴 Geografiya 9-11 sinf'],
      ['🎓 Geografiya Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const tarixLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 5-7 sinf', '🟡 7-9 sinf'],
      ['🔴 9-11 sinf'],
      ['🎓 Tarix Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const matematikaLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Matematika 5-7 sinf', '🟡 Matematika 7-9 sinf'],
      ['🔴 Matematika 9-11 sinf'],
      ['🎓 Matematika Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const fizikaLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Fizika 5-7 sinf', '🟡 Fizika 7-9 sinf'],
      ['🔴 Fizika 9-11 sinf'],
      ['🎓 Fizika Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const kimyoLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟡 Kimyo 7-9 sinf', '🔴 Kimyo 9-11 sinf'],
      ['🎓 Kimyo Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const biologiyaLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Biologiya 5-7 sinf', '🟡 Biologiya 7-9 sinf'],
      ['🔴 Biologiya 9-11 sinf'],
      ['🎓 Biologiya Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const adabiyotLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Adabiyot 5-7 sinf', '🟡 Adabiyot 7-9 sinf'],
      ['🔴 Adabiyot 9-11 sinf'],
      ['🎓 Adabiyot Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const onaTiliLevelMenu = {
  reply_markup: {
    keyboard: [
      ['🟢 Ona tili 5-7 sinf', '🟡 Ona tili 7-9 sinf'],
      ['🔴 Ona tili 9-11 sinf'],
      ['🎓 Ona tili Milliy sertifikat'],
      ['⬅️ Fanga qaytish']
    ],
    resize_keyboard: true
  }
};

const languagesMenu = {
  reply_markup: {
    keyboard: [
      ['🇬🇧 Ingliz tili'],
      ['🇷🇺 Rus tili'],
      ['⬅️ Orqaga']
    ],
    resize_keyboard: true
  }
};

const inglizMenu = {
  reply_markup: {
    keyboard: [
      ['🔤 Umumiy sinov'],
      ["📖 So'z boyligi"],
      ['📜 CEFR darajasini bilib olish'],
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

const rusMenu = {
  reply_markup: {
    keyboard: [
      ['🔤 Rus tili umumiy sinovi'],
      ['📜 Rus tili CEFR darajasini bilib olish'],
      ['⬅️ Tillarga qaytish']
    ],
    resize_keyboard: true
  }
};

const rusCefrLevelMenu = {
  reply_markup: {
    keyboard: [
      ["🟢 Rus A1-A2 (Boshlang'ich)"],
      ["🟡 Rus B1-B2 (O'rta)", "🔴 Rus C1-C2 (Yuqori)"],
      ['⬅️ Rus tiliga qaytish']
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

const allMenuButtons = [
  '🎮 Qiziqarli sinovlar', '📚 Maktab fanlari', '🌐 Tillar', "💻 IT yo'nalishlari",
  '🎁 Do\'stlarni taklif qilish', '📝 Taklif bildirish', '⚽ Sport sinovi', '🎬 Kino-Musiqa sinovi',
  '💡 Fakt sinovi', '💻 Texnologiya sinovi', '📜 Tarix sinovi', '➗ Matematika sinovi',
  '⚛️ Fizika sinovi', '🧪 Kimyo sinovi', '🧬 Biologiya sinovi', '📖 Adabiyot sinovi',
  '✍️ Ona tili sinovi', '🌍 Geografiya sinovi', '🇬🇧 Ingliz tili', '🇷🇺 Rus tili',
  '📜 Rus tili CEFR darajasini bilib olish', '📜 CEFR darajasini bilib olish',
  '⬅️ Orqaga', '⬅️ Fanga qaytish', '⬅️ Tillarga qaytish', '⬅️ Ingliz tiliga qaytish', '⬅️ Rus tiliga qaytish'
];

bot.getMe().then((info) => {
  botUsername = info.username;
  console.log(`Bot username aniqlandi: @${botUsername}`);
}).catch((err) => {
  console.error("Bot username'ni olishda xato:", err.message);
});

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const payload = match && match[1] ? match[1].trim() : null;

  let referrerId = null;
  if (payload && payload.startsWith('ref_')) {
    referrerId = payload.replace('ref_', '');
  }

  const newUserInfo = {
    name: buildDisplayName(msg.from),
    username: msg.from.username ? `@${msg.from.username}` : null,
  };

  const result = await registerUser(chatId, referrerId, newUserInfo);

  if (result.isNew && result.referrerId) {
    const newCount = await getReferralCount(result.referrerId);
    const joinerLabel = newUserInfo.username
      ? `${newUserInfo.name} (${newUserInfo.username})`
      : newUserInfo.name;

    bot.sendMessage(
      result.referrerId,
      `🎉 Sizning taklifingiz orqali yangi foydalanuvchi botga qo'shildi!\n👤 Kim: ${joinerLabel}\n📊 Jami taklif qilganlaringiz: ${newCount} ta`
    ).catch(() => {});

    if (result.referrerReachedBonus) {
      bot.sendMessage(
        result.referrerId,
        `🏆 Tabriklaymiz! Siz ${REFERRAL_BONUS_THRESHOLD} ta do'stingizni taklif qildingiz.\nSizga maxsus bonus tayyorladik — tez orada bog'lanamiz! 🎁`
      ).catch(() => {});
    }
  }

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
  "📖 Lug'at (IELTS)": { key: 'lugat_ielts', nom: "IELTS lug'ati" },
  '🟢 5-7 sinf': { key: 'tarix_5_7', nom: 'Tarix sinovi (5-7 sinf)' },
  '🟡 7-9 sinf': { key: 'tarix_7_9', nom: 'Tarix sinovi (7-9 sinf)' },
  '🔴 9-11 sinf': { key: 'tarix_9_11', nom: 'Tarix sinovi (9-11 sinf)' },
  '🟢 Matematika 5-7 sinf': { key: 'matematika_5_7', nom: 'Matematika sinovi (5-7 sinf)' },
  '🟡 Matematika 7-9 sinf': { key: 'matematika_7_9', nom: 'Matematika sinovi (7-9 sinf)' },
  '🔴 Matematika 9-11 sinf': { key: 'matematika_9_11', nom: 'Matematika sinovi (9-11 sinf)' },
  '🟢 Fizika 5-7 sinf': { key: 'fizika_5_7', nom: 'Fizika sinovi (5-7 sinf)' },
  '🟡 Fizika 7-9 sinf': { key: 'fizika_7_9', nom: 'Fizika sinovi (7-9 sinf)' },
  '🔴 Fizika 9-11 sinf': { key: 'fizika_9_11', nom: 'Fizika sinovi (9-11 sinf)' },
  '🟡 Kimyo 7-9 sinf': { key: 'kimyo_7_9', nom: 'Kimyo sinovi (7-9 sinf)' },
  '🔴 Kimyo 9-11 sinf': { key: 'kimyo_9_11', nom: 'Kimyo sinovi (9-11 sinf)' },
  '🟢 Biologiya 5-7 sinf': { key: 'biologiya_5_7', nom: 'Biologiya sinovi (5-7 sinf)' },
  '🟡 Biologiya 7-9 sinf': { key: 'biologiya_7_9', nom: 'Biologiya sinovi (7-9 sinf)' },
  '🔴 Biologiya 9-11 sinf': { key: 'biologiya_9_11', nom: 'Biologiya sinovi (9-11 sinf)' },
  '🟢 Adabiyot 5-7 sinf': { key: 'adabiyot_5_7', nom: 'Adabiyot sinovi (5-7 sinf)' },
  '🟡 Adabiyot 7-9 sinf': { key: 'adabiyot_7_9', nom: 'Adabiyot sinovi (7-9 sinf)' },
  '🔴 Adabiyot 9-11 sinf': { key: 'adabiyot_9_11', nom: 'Adabiyot sinovi (9-11 sinf)' },
  '🟢 Ona tili 5-7 sinf': { key: 'ona_tili_5_7', nom: 'Ona tili sinovi (5-7 sinf)' },
  '🟡 Ona tili 7-9 sinf': { key: 'ona_tili_7_9', nom: 'Ona tili sinovi (7-9 sinf)' },
  '🔴 Ona tili 9-11 sinf': { key: 'ona_tili_9_11', nom: 'Ona tili sinovi (9-11 sinf)' },
  '🟢 Geografiya 5-7 sinf': { key: 'geografiya_5_7', nom: 'Geografiya sinovi (5-7 sinf)' },
  '🟡 Geografiya 7-9 sinf': { key: 'geografiya_7_9', nom: 'Geografiya sinovi (7-9 sinf)' },
  '🔴 Geografiya 9-11 sinf': { key: 'geografiya_9_11', nom: 'Geografiya sinovi (9-11 sinf)' },
  '🎓 Geografiya Milliy sertifikat': { key: 'geografiya_milliy', nom: 'Geografiya sinovi (Milliy sertifikat)' },
  '🎨 Frontend sinovi': { key: 'frontend', nom: 'Frontend sinovi' },
  '⚙️ Backend sinovi': { key: 'backend', nom: 'Backend sinovi' },
  '📱 Mobil dasturlash sinovi': { key: 'mobil', nom: 'Mobil dasturlash sinovi' },
  '📊 Data Science sinovi': { key: 'data_science', nom: 'Data Science sinovi' },
  '🤖 AI/ML sinovi': { key: 'ai_ml', nom: 'AI/ML sinovi' },
  '🔒 Kiberxavfsizlik sinovi': { key: 'kiberxavfsizlik', nom: 'Kiberxavfsizlik sinovi' },
  '🎨 UI/UX Dizayn sinovi': { key: 'uiux', nom: 'UI/UX Dizayn sinovi' },
  '🌐 Tarmoqlar sinovi': { key: 'tarmoqlar', nom: 'Tarmoqlar sinovi' },
  "🗄️ Ma'lumotlar bazasi sinovi": { key: 'malumotlar_bazasi', nom: "Ma'lumotlar bazasi sinovi" },
  '🦾 Robototexnika sinovi': { key: 'robototexnika', nom: 'Robototexnika sinovi' },
  '🔤 Rus tili umumiy sinovi': { key: 'rus_umumiy', nom: 'Rus tili umumiy sinovi' },
  "🟢 Rus A1-A2 (Boshlang'ich)": { key: 'rus_cefr_a1_a2', nom: 'Rus tili CEFR sinovi (A1-A2)' },
  "🟡 Rus B1-B2 (O'rta)": { key: 'rus_cefr_b1_b2', nom: "Rus tili CEFR sinovi (B1-B2)" },
  "🔴 Rus C1-C2 (Yuqori)": { key: 'rus_cefr_c1_c2', nom: "Rus tili CEFR sinovi (C1-C2)" },
  '🎓 Matematika Milliy sertifikat': { key: 'matematika_milliy', nom: 'Matematika sinovi (Milliy sertifikat)' },
  '🎓 Tarix Milliy sertifikat': { key: 'tarix_milliy', nom: 'Tarix sinovi (Milliy sertifikat)' },
  '🎓 Fizika Milliy sertifikat': { key: 'fizika_milliy', nom: 'Fizika sinovi (Milliy sertifikat)' },
  '🎓 Kimyo Milliy sertifikat': { key: 'kimyo_milliy', nom: 'Kimyo sinovi (Milliy sertifikat)' },
  '🎓 Biologiya Milliy sertifikat': { key: 'biologiya_milliy', nom: 'Biologiya sinovi (Milliy sertifikat)' },
  '🎓 Adabiyot Milliy sertifikat': { key: 'adabiyot_milliy', nom: 'Adabiyot sinovi (Milliy sertifikat)' },
  '🎓 Ona tili Milliy sertifikat': { key: 'ona_tili_milliy', nom: 'Ona tili sinovi (Milliy sertifikat)' },
  "🟢 A1-A2 (Boshlang'ich)": { key: 'cefr_a1_a2', nom: 'Ingliz tili CEFR sinovi' },
  "🟡 B1-B2 (O'rta)": { key: 'cefr_b1_b2', nom: "Ingliz tili CEFR sinovi (B1-B2)" },
  "🔴 C1-C2 (Yuqori)": { key: 'cefr_c1_c2', nom: "Ingliz tili CEFR sinovi (C1-C2)" }
};

const tayyorEmasMavzular = [];

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (chatId === ADMIN_CHAT_ID && msg.reply_to_message) {
    return;
  }

  if (allMenuButtons.includes(text) && text !== '📝 Taklif bildirish') {
    if (awaitingSuggestion.has(chatId)) {
      awaitingSuggestion.delete(chatId);
      const buffer = suggestionBuffers.get(chatId);
      if (buffer) clearTimeout(buffer.timeout);
      suggestionBuffers.delete(chatId);
    }
  }

  const pendingFallback = fallbackTimers.get(chatId);
  if (pendingFallback) {
    clearTimeout(pendingFallback);
    fallbackTimers.delete(chatId);
  }

  // ==== 0) DO'STLARNI TAKLIF QILISH TUGMASI ====
  if (text === '🎁 Do\'stlarni taklif qilish') {
    const link = getReferralLink(chatId);
    const count = await getReferralCount(chatId);
    const referredList = await getReferredUsersList(chatId);

    let ro_yxatMatni = '';
    if (referredList.length > 0) {
      const oxirgilar = referredList.slice(0, 10).map((u, i) => {
        const label = u.username ? `${u.name} (${u.username})` : u.name;
        return `${i + 1}. ${label}`;
      }).join('\n');
      const qolganlar = referredList.length > 10 ? `\n...va yana ${referredList.length - 10} kishi` : '';
      ro_yxatMatni = `\n\n👥 Taklif qilganlaringiz:\n${oxirgilar}${qolganlar}`;
    }

    bot.sendMessage(
      chatId,
      `🎁 Do'stlaringizni taklif qiling!\n\nHar bir taklif qilingan do'stingiz uchun ballar to'plang.\n\n🔗 Sizning shaxsiy havolangiz:\n${link}\n\n📊 Hozirgacha taklif qilganlaringiz: ${count} kishi${ro_yxatMatni}`
    ).catch((err) => {
      console.error("Referal xabarini yuborishda xato:", err.message);
    });
    return;
  }

  // ==== 1) TAKLIF BILDIRISH TUGMASI ====
  if (text === '📝 Taklif bildirish') {
    awaitingSuggestion.add(chatId);
    bot.sendMessage(
      chatId,
      "✍️ Taklif yoki fikringizni yozib yuboring — o'qib chiqaman!\n\nBekor qilish uchun /cancel yozing."
    );
    return;
  }

  // ==== 2) FOYDALANUVCHI TAKLIF YOZAYOTGAN HOLATDA BO'LSA ====
  if (awaitingSuggestion.has(chatId)) {
    if (text === '/cancel') {
      const buffer = suggestionBuffers.get(chatId);
      if (buffer) clearTimeout(buffer.timeout);
      suggestionBuffers.delete(chatId);
      awaitingSuggestion.delete(chatId);
      bot.sendMessage(chatId, "Bekor qilindi.", mainMenu);
      return;
    }

    let buffer = suggestionBuffers.get(chatId);
    if (buffer) {
      clearTimeout(buffer.timeout);
      buffer.messageIds.push(msg.message_id);
    } else {
      buffer = { messageIds: [msg.message_id] };
    }
    buffer.timeout = setTimeout(
      () => finalizeSuggestion(chatId, msg.from, buffer.messageIds),
      SUGGESTION_DEBOUNCE_MS
    );
    suggestionBuffers.set(chatId, buffer);
    return;
  }

  // ==== ASOSIY MENYU ====
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

  if (text === '➗ Matematika sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", matematikaLevelMenu);
    return;
  }

  if (text === '⚛️ Fizika sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", fizikaLevelMenu);
    return;
  }

  if (text === '🧪 Kimyo sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", kimyoLevelMenu);
    return;
  }

  if (text === '🧬 Biologiya sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", biologiyaLevelMenu);
    return;
  }

  if (text === '📖 Adabiyot sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", adabiyotLevelMenu);
    return;
  }

  if (text === '✍️ Ona tili sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", onaTiliLevelMenu);
    return;
  }

  if (text === '🌍 Geografiya sinovi') {
    bot.sendMessage(chatId, "Qaysi daraja uchun sinovni xohlaysiz?", geografiyaLevelMenu);
    return;
  }

  if (text === '🇬🇧 Ingliz tili') {
    bot.sendMessage(chatId, "Qaysi turdagi sinovni xohlaysiz?", inglizMenu);
    return;
  }

  if (text === '🇷🇺 Rus tili') {
    bot.sendMessage(chatId, "Qaysi turdagi sinovni xohlaysiz?", rusMenu);
    return;
  }

  if (text === '📜 Rus tili CEFR darajasini bilib olish') {
    bot.sendMessage(chatId, "Qaysi daraja guruhini sinab ko'rasiz?\n\n⚠️ Eslatma: bu taxminiy natija, rasmiy sertifikat emas.", rusCefrLevelMenu);
    return;
  }

  if (text === '⬅️ Rus tiliga qaytish') {
    bot.sendMessage(chatId, "Qaysi turdagi sinovni xohlaysiz?", rusMenu);
    return;
  }

  if (text === '📜 CEFR darajasini bilib olish') {
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
    const ogohlantirish = key.endsWith('_milliy')
      ? "\n\n⚠️ Eslatma: bu taxminiy natija beruvchi mashq, rasmiy Milliy sertifikat imtihoni emas."
      : '';
    bot.sendMessage(chatId, `${nom} boshlanmoqda 👇${ogohlantirish}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: `${nom}ni boshlash`, web_app: { url: `${MINI_APP_URL}?mavzu=${key}&t=${Date.now()}` } }]
        ]
      }
    });
    return;
  }

  // ==== HECH QAYSI TUGMAGA/HOLATGA MOS KELMAGAN XABAR ====
  if (!text || !text.startsWith('/')) {
    const existingTimer = fallbackTimers.get(chatId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      fallbackTimers.delete(chatId);
      bot.sendMessage(
        chatId,
        "🤔 Kechirasiz, bu buyruqni tushunmadim.\nIltimos, quyidagi tugmalardan birini tanlang 👇",
        mainMenu
      ).catch(() => {});
    }, FALLBACK_DEBOUNCE_MS);

    fallbackTimers.set(chatId, timer);
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
