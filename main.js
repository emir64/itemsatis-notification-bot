const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ]});
const config = (global.config = require("./config.json"))

require("./src/handlers/mongoConnect")
client.orders = require('./src/models/orders');

async function lastOrders() {
    try {
        var headers = {
            "Cookie": config["cookie"],
            "User-Agent": config["user-agent"]
        }
        var form = new URLSearchParams();
        form.append('Page', 1);
        var res = await fetch("https://www.itemsatis.com/api/getMySoldOrders", { "headers": headers, "body": form, "method": "POST" })
        var orders = await res.json()
        if(orders["success"] !== true) return
        return orders["Datas"]
    } catch(err) {
        console.log(`lastOrders() function error: ${err}`)
    }
}

async function getDetails(orderId) {
    try {
        var headers = {
            "Cookie": config["cookie"],
            "User-Agent": config["user-agent"]
        }
        var form = new URLSearchParams();
        form.append('orderID', orderId);
        var res = await fetch("https://www.itemsatis.com/api/getMySoldOrderDetail", { "headers": headers, "body": form, "method": "POST" })
        var details = await res.json()
        if(details["success"] !== true) return null;
        return { 
            "orderID": orderId, 
            "postName": details["Data"]["Title"], 
            "postID": details["Data"]["AdvertId"], 
            "postLink": `https://www.itemsatis.com/${details["Data"]["Link"]}`,
            "postPrice": details["Data"]["Price"], 
            "postBanner": `https://cdn.itemsatis.com/${details["Data"]["AdvertImage"]}`,
            "soldDate": details["Data"]["Datetime"],
            "categoryName": details["Data"]["categoryName"],
            "customerName": details["Data"]["Alici"]["UserName"], 
            "customerID": details["Data"]["Alici"]["UserId"], 
            "customerAvatar": details["Data"]["Alici"]["Avatar"], 
            "profileLink":  details["Details"].length >=1 ? details["Details"][0]["Value"] : null, 
        }
    } catch(err) {
        console.log(`getDetails() function error: ${err}`)
        return null;
    }
}

async function start() {

    let orders = await lastOrders()
    if(!orders) return;
    console.log("Siparişler Checkleniyor...")
    await orders.forEach(async (order) => {

        let findData = await client.orders.findOne({ orderID: order["Id"] })
        if(findData) return;
        
        try {
            var details = await getDetails(order["Id"])
            if(config["auto_order"] == true) {
                if(details["link"]) createOrder(details["link"], details["postID"])
            }

            var orderID = details["orderID"]
            var postName = details["postName"]
            var postID = details["postID"]
            var postLink = details["postLink"]
            var postPrice = details["postPrice"]
            var postBanner = details["postBanner"]
            var soldDate = details["soldDate"]
            var categoryName = details["categoryName"]
            var customerName = details["customerName"]
            var customerID = details["customerID"]
            var customerAvatar = details["customerAvatar"]
            var profileLink = details["profileLink"]

        } catch(err) {
            console.log(`Sipariş detayları alınamadı: ${err}`)
        }

        try {
            const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle(postName)
            .setURL(postLink)
            .addFields(
                { name: `Kategori`, value: `${categoryName}`, inline: true  },
                { name: `Müşteri`, value: `${customerName}`, inline: true  },  
                { name: `Fiyat`, value: `${postPrice}TL`, inline: true  },
                { name: `Tarih`, value: `${soldDate}`, inline: true  },
            )
            .setThumbnail(postBanner)
            .setFooter({ text: `Sipariş ID: ${orderID}`, iconURL: client.user.avatarURL({ dynamic: true }) })
            client.channels.cache.get(config["logChannel"]).send({ embeds: [embed] });
        } catch(err) {
            console.log(`Embed gönderilemedi: ${err}`)
        }
        
        new client.orders({ 
            orderID: orderID,
            postName: postName,
            postID: postID,
            postPrice: postPrice, 
            postBanner: postBanner,
            categoryName: categoryName,
            customerName: customerName,
            customerID: customerID,
            customerAvatar: customerAvatar,
            profileLink: profileLink,
            soldDate: soldDate,
        }).save().catch(e => console.log(e));          

    })
}

async function counter() {
    await start()
    setInterval(async () => { 
        await start()
    }, 300000) // 5 dakika
}
        
(async() => {
    console.clear()
    client.login(config["bot_token"]).catch(e => console.log(`Gecersiz token: ${config["bot_token"]}`));
    client.on('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);
        await counter()
    })
})()