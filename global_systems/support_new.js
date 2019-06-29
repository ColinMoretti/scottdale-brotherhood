const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, support_loop, support_cooldown, connection, st_cd, t_mode) => {
    const image = new Discord.RichEmbed();
    image.setImage("https://imgur.com/LKDbJeM.gif");

    if (message.channel.name == "support"){
        if (message.author.bot) return message.delete();
        if (support_cooldown.has(message.author.id)){
            return message.delete();
        }
        if (!message.member.hasPermission("ADMINISTRATOR")) support_cooldown.add(message.author.id);
        setTimeout(() => {
            if (support_cooldown.has(message.author.id)) support_cooldown.delete(message.author.id);
        }, 300000);

        connection.query(`SELECT * FROM \`tickets-global\` WHERE \`server\` = '${message.guild.id}'`, async (error, result) => {
            if (error) return message.delete();
            if (result.length == 0){
                message.channel.send(`` +
                `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                `**Количество вопросов за все время: 0**\n` +
                `**Необработанных модераторами: 0**\n` +
                `**Вопросы на рассмотрении: 0**\n` +
                `**Закрытых: 0**`, image).then(msg => {
                    connection.query(`INSERT INTO \`tickets-global\` (\`server\`, \`message\`, \`tickets\`, \`open\`, \`hold\`, \`close\`) VALUES ('${message.guild.id}', '${msg.id}', '0', '0', '0', '0')`);
                });
                return message.delete();
            }else{
                let rep_message = await message.channel.fetchMessage(result[0].message).catch(async err => {
                    await message.channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${result[0].open}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].close}**`, image).then(msg => {
                        rep_message = msg;
                        connection.query(`UPDATE \`tickets-global\` SET message = '${msg.id}' WHERE \`server\` = '${message.guild.id}'`);
                    });
                });
                let category = message.guild.channels.find(c => c.name == "Активные жалобы");
                let moderator = await message.guild.roles.find(r => r.name == 'Support Team');
                if (!category || !moderator) return message.delete();
                if (category.children.size >= 45){
                    message.reply(`\`обращения в поддержку временно недоступны. Повторите попытку позднее.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                message.guild.createChannel(`ticket-${+result[0].tickets + 1}`, 'text', [
                    {
                        id: moderator.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                    },
                    {
                        id: message.member.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                    },
                    {
                        id: message.guild.id,
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
                    }
                ]).then(async channel => {
                    rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${+result[0].tickets + 1}**\n` +
                    `**Необработанных модераторами: ${+result[0].open + 1}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].close}**`, image);
                    connection.query(`UPDATE \`tickets-global\` SET tickets = tickets + 1 WHERE \`server\` = '${message.guild.id}'`);
                    connection.query(`UPDATE \`tickets-global\` SET open = open + 1 WHERE \`server\` = '${message.guild.id}'`);
                    message.delete();
                    await channel.setParent(category.id).catch(() => {
                        channel.setParent(category.id);
                    });
                    channel.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                        color: 3447003,
                        title: "Обращение к поддержке Discord",
                        fields: [{
                            name: "Отправитель",
                            value: `**Пользователь:** <@${message.author.id}>`,
                        },{
                            name: "Суть обращения",
                            value: `${message.content}`,
                        }]
                    }});
                    connection.query(`INSERT INTO \`tickets\` (\`server\`, \`ticket_id\`, \`question\`, \`author\`) VALUES ('${message.guild.id}', '${+result[0].tickets + 1}', '${message.content}', '${message.author.id}')`);
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[CREATE]\` <@${message.author.id}> \`создал обращение к поддержке:\` <#${channel.id}> \`[${channel.name}]\``);
                    message.channel.send(`<@${message.author.id}>, \`обращение составлено. Нажмите на\` <#${channel.id}>`).then(msg => msg.delete(15000));
                });
            }
        });
    }

    if (message.content == '/hold'){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (st_cd.has(message.guild.id)){
            message.reply(`**\`подождите, запрос обрабатывается..\`**`).then(msg => msg.delete(6000));
            return message.delete();
        }
        st_cd.add(message.guild.id);
        setTimeout(() => {
            if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id);
        }, 7000);

        connection.query(`SELECT * FROM \`tickets\` WHERE server = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`, async (err, tickets) => {
            if (err){
                message.reply(`\`произошла ошибка на стороне web-сервера. повторите попытку позднее\``).then(msg => msg.delete(7000));
                return message.delete();
            }
            if (+tickets[0].status != 1) return message.delete();
            let category = message.guild.channels.find(c => c.name == "Жалобы на рассмотрении");
            let ticket_channel = message.guild.channels.find(c => c.name == 'support');
            let author = message.guild.members.get(tickets[0].author);
            if (!category || !ticket_channel) return message.delete();
            await message.channel.setParent(category.id).catch(() => {
                message.channel.setParent(category.id);
            });
            connection.query(`SELECT * FROM \`tickets-global\` WHERE \`server\` = '${message.guild.id}'`, async (error, result) => {
                if (error) return message.delete();
                if (result.length == 0){
                    ticket_channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: 0**\n` +
                    `**Необработанных модераторами: 0**\n` +
                    `**Вопросы на рассмотрении: 0**\n` +
                    `**Закрытых: 0**`, image).then(msg => {
                        connection.query(`INSERT INTO \`tickets-global\` (\`server\`, \`message\`, \`tickets\`, \`open\`, \`hold\`, \`close\`) VALUES ('${message.guild.id}', '${msg.id}', '0', '0', '0', '0')`);
                    });
                    return message.delete();
                }else{
                    let rep_message = await ticket_channel.fetchMessage(result[0].message).catch(async (err) => {
                        await ticket_channel.send(`` +
                        `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                        `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                        `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                        `**Необработанных модераторами: ${result[0].open}**\n` +
                        `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                        `**Закрытых: ${result[0].close}**`, image).then(msg => {
                            rep_message = msg;
                            connection.query(`UPDATE \`tickets-global\` SET message = '${msg.id}' WHERE \`server\` = '${message.guild.id}'`);
                        });
                    });
                    rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${+result[0].open - 1}**\n` +
                    `**Вопросы на рассмотрении: ${+result[0].hold + 1}**\n` +
                    `**Закрытых: ${result[0].close}**`, image);
                    connection.query(`UPDATE \`tickets\` SET status = 2 WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
                    connection.query(`UPDATE \`tickets-global\` SET open = open - 1 WHERE \`server\` = '${message.guild.id}'`);
                    connection.query(`UPDATE \`tickets-global\` SET hold = hold + 1 WHERE \`server\` = '${message.guild.id}'`);
                    if (author){
                        message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                    }else{
                        message.channel.send(`\`Жалобе <#${message.channel.id}> был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                    }
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[HOLD]\` \`Модератор ${message.member.displayName || message.member.user.tag} установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'На рассмотрении'\``);
                    return message.delete();
                }
            });
        });
    }
    return
};