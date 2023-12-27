const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ]});
const { token, bot_token, log_channel } = require("./config.js")
const fetch = require("node-fetch");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function lastOrders() {
    try {
        let res = await fetch("https://www.itemsatis.com/api/merchant/v1/getMySoldOrders", { "body": `{\"Page\":1,\"Limit\":10,\"token\":\"${token}\"}`, "method": "POST" })
        let orders = await res.json()
        if(orders["success"] == true) {
            return orders["Datas"]
        } else {
            console.log(`Hata: ${orders["message"]}`)
            return null
        }
    } catch(err) {
        console.log(`Son siparişler çekilirken bir sorun oluştu: ${err}`)
    }
}

async function start() {

    let orders = await lastOrders()
    if(!orders) return;
    console.log("Siparişler Checkleniyor...")
    for (const order of orders) {

        let findData = await db.get(`orders`);
        if(findData && findData.find(x => x.orderID == order["Id"])) return;
        await db.push(`orders`, { orderID: order["Id"]});
        console.log(`Yeni Sipariş Geldi > ${order["Title"]} `)

        let embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle(order["Title"])
        .addFields(
            { name: `Kategori`, value: `${order["CategoryName"]}`, inline: true  },
            { name: `Müşteri`, value: `${order["UserName"]}`, inline: true  },  
            { name: `Fiyat`, value: `${order["Price"]}TL`, inline: true  },
            { name: `Tarih`, value: `${order["Datetime"]}`, inline: true  },
        )
        .setFooter({ text: `Sipariş ID: ${order["Id"]}`, iconURL: client.user.avatarURL({ dynamic: true }) })
        client.channels.cache.get(log_channel).send({ embeds: [embed] });
    }
}

async function counter() {
    await start()
    setInterval(async () => { 
        await start()
    }, 120000) // 2 dakika
}
        
(async() => {
    console.clear()
    client.login(bot_token).catch(e => console.log(`Bot giriş yapamadı: ${e}`));
    client.on('ready', async () => {
        console.log(`${client.user.tag} Aktif!`);
        await counter()
    })
})()
