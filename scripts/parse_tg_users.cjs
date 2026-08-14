const fs = require('fs');

const BOT_TOKEN = '8142466188:AAHmgvq2mvwvKl4v1IOsSkFxE3FxPmfXn_o';

const userIds = [
  169262990, 8092697980, 1618738722, 335711925, 81217823, 838060543, 743565887, 5182562369, 
  817667825, 1940677013, 443462127, 644328901, 6989398032, 1052491330, 524750284, 5773648634, 
  784747733, 6664273023, 1300150321, 189415023, 517574209, 305900232, 5437124158, 188978073, 
  441276061, 446907376, 1962321823, 191399234, 329003336, 201175396, 463146089, 140736088, 
  969580039, 300568260, 64147573, 920283212, 5887849512, 7417667364, 701741332, 599144417, 
  566144622, 756477098, 883374523, 6972252687, 1069687437, 527563717, 8038666536, 466056300, 
  385254638, 900063102, 182861741, 5617521643, 356715953, 427798325, 1913335038, 588860280, 
  1546582757, 6444633164, 906398689, 1395233197, 798537475, 383048534, 6087373374, 1831192124, 
  392429128, 617478325, 6783113722, 1090207996, 1506036379, 244953314, 1379227905, 6746211081, 
  367530544, 399444307, 337166309, 6570554423, 130783802, 144520516, 6174549043, 399578586, 
  742279550, 5855021972, 5566608810, 916394493, 277779685, 1399584930, 1338170577, 7954007, 
  1323550937, 2469402, 344915419, 1472340369, 5518403678, 6278851995, 449084838, 546553656, 
  6027341197, 437218617, 7769742497, 689152545, 66855705, 966477656, 293919327, 6146792217, 
  235690308, 490189663, 533032168, 106575102, 1131776158, 148045666, 2014905423, 6248992152, 
  754080663, 1804010506, 822717828, 236443351, 6911438054, 768312176, 209244704, 2074601357, 
  7831969393, 1008002584, 664711454, 447883706, 279150751, 323069932, 6736136137, 226528516, 
  216595141, 5575990235, 908690786, 5375602485, 1171763992, 213636807, 626248323, 456894566, 
  5142457533, 1251191874, 194056258, 425023747, 623293879, 5403213651, 7466250619, 275232659, 
  6549738214, 544396797, 755372424, 507335874, 1017907545, 490646920, 6174178341, 1757084105, 
  923985222, 8178481483, 8041663009, 928178753, 5126185210, 234213419, 6132339026, 332136748, 
  258238504, 98660652, 1042057566, 2114595139, 660785940, 6266482385, 756044121, 241414877, 
  909136800, 1392275970, 282068700, 6030903911, 454550336, 907359077, 310980230, 6434994668, 
  273009597, 394354927, 5010807202, 458613888, 188516337, 1626826451, 5269512194, 256713833, 
  1348645446, 648944081, 950667, 184971076, 5493768365, 426454938, 2139848551, 506477372, 
  495006498, 5609870061, 7277086394, 336644387, 370507074, 7640519447, 148230047, 5007496296, 
  3510990, 6683958783, 1686121694, 6995672235, 7930822421, 128247430, 6579108183, 372025324, 
  786293828, 143731572, 7822041669, 829739651, 791676358, 1028276899, 1442814816, 528559893, 
  5711667098, 407466569, 617218162, 654459478, 184692900, 368021527, 530308640, 464873732, 
  202342418, 2134521533, 5352012626, 1274149787, 174264171, 6917253767, 111907996, 1070570690, 
  5554167696, 6724895749, 7585133034, 1225340279, 7815615833, 6497746504, 648519145, 8236157369, 
  780643908, 1046426621, 8160844528, 1045089575, 8239671976, 237441987, 6668509906, 1089524536, 
  5552822904, 955081560, 303850018, 376193055, 8130710204, 6293576731, 2014662697, 5687573131, 
  6078884080, 6597211249, 566237452, 6340098874, 6571881489, 5399607946
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processUsers() {
  console.log(`Starting parsing & status check for ${userIds.length} users...`);
  const results = [];

  for (let i = 0; i < userIds.length; i++) {
    const tgId = userIds[i];
    let status = 'Удален';
    let allowWrite = 0;

    // 1. Check chat action status (detect Active, Blocked, Deleted)
    try {
      const actRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction?chat_id=${tgId}&action=typing`);
      const actData = await actRes.json();
      if (actData.ok) {
        status = 'Активный';
        allowWrite = 1;
      } else {
        const errDesc = (actData.description || '').toLowerCase();
        if (errDesc.includes('blocked') || errDesc.includes('forbidden')) {
          status = 'Блок';
        } else {
          status = 'Удален';
        }
      }
    } catch (e) {
      status = 'Удален';
    }

    // 2. Get profile details from getChat
    let profile = null;
    try {
      const chatRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${tgId}`);
      const chatData = await chatRes.json();
      if (chatData.ok) {
        profile = chatData.result;
      }
    } catch (e) {}

    const u = profile || {};
    const firstName = u.first_name || `Пользователь #${tgId}`;
    const lastName = u.last_name || '';
    const username = u.username || `user_${tgId}`;
    const bio = u.bio || (status === 'Блок' ? 'Заблокировал бота в Telegram' : (status === 'Удален' ? 'Аккаунт не найден или удален' : ''));

    results.push({
      id: String(tgId),
      email: u.username ? `${u.username.toLowerCase()}@telegram.user` : `user_${tgId}@telegram.user`,
      password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      role: tgId === 169262990 ? 'admin' : 'user',
      telegram_id: tgId,
      first_name: firstName,
      last_name: lastName,
      username: username,
      photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${tgId}`,
      profile_link: u.username ? `https://t.me/${u.username}` : `https://t.me/user_${tgId}`,
      bio: bio,
      is_premium: u.is_premium ? 1 : 0,
      language_code: u.language_code || 'ru',
      phone: '',
      allows_write_to_pm: allowWrite,
      status: status,
      balance: status === 'Активный' ? 1000 : 0,
      referral_reward_balance: 0.0,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    });

    if ((i + 1) % 50 === 0 || i === userIds.length - 1) {
      console.log(`Processed ${i + 1}/${userIds.length} users...`);
    }
    await sleep(40);
  }

  console.log(`Completed status parsing. Total parsed users: ${results.length}`);
  fs.writeFileSync('parsed_users.json', JSON.stringify(results, null, 2));
  console.log('Saved updated parsed_users.json');
}

processUsers();
