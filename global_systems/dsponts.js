const Discord = require('discord.js');
const fs = require("fs");

function isInteger(n) {
    return n === +n && n === (n|0);
}

// Структура
// STORAGE: [id, name, description, owner, cost, amount, money, code]
// ITEMS: [id, storage_id, date_end]
// BUY_DASHBOARD: [id, name, description, status, cost, money, amount, owner, code]

// Пример
// STORAGE: [1, Роли, Тут вы сможете запустить создание роли, 336207279412215809, 12.7, 0, 25.4, return 1]
// ITEMS: [1, 1, 1558155451169]
//        [2, 1, 1558155451297]
// BUY_DASHBOARD: [1, Покупка роли, Тут вы сможете купить роль, открыто, 13, 0, 0, 336207279412215809, return 1]

exports.run = async (bot, message, ds_cooldown, connection, mysql_cooldown) => {
    if (!message.member.roles) return
    if (!message.member.roles.some(r => r.name == 'Проверенный 🔐')) return

    if (!ds_cooldown.has(message.author.id)){
        ds_cooldown.add(message.author.id);
        setTimeout(() => {
            if (ds_cooldown.has(message.author.id)) ds_cooldown.delete(message.author.id);
        }, 180000);
        connection.query(`SELECT \`id\`, \`userid\`, \`points\` FROM \`accounts\` WHERE \`userid\` = '${message.author.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
            if (result.length == 0){
                connection.query(`INSERT INTO \`accounts\` (\`userid\`, \`points\`) VALUES ('${message.author.id}', '0.5')`);
            }else{
                connection.query(`UPDATE \`accounts\` SET points = points + 0.5 WHERE \`userid\` = '${message.author.id}'`);
            }
        });
    }

    /*if (message.content.startsWith('/pay')){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попробуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
    }*/

    if (message.content == '/balance'){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        connection.query(`SELECT \`id\`, \`userid\`, \`points\` FROM \`accounts\` WHERE \`userid\` = '${message.author.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#352]`);
            if (result.length == 0){
                message.reply(`**ваш баланс составляет 0 ₯**`);
                return message.delete();
            }else{
                message.reply(`**ваш баланс составляет ${result[0].points} ₯**`);
                return message.delete();
            }
        });
    }

    if (message.content.startsWith('/bizinfo')){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/bizinfo`).split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /bizinfo [название товара]\``);
            return message.delete();
        }
        let name = args.slice(1).join(' ');
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`name\` = '${name}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`заведение, которое вы пытаетесь найти не найдено или не ваше!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            const embed = new Discord.RichEmbed();
            embed.setTitle(`Информация о ${result[0].name} [ID: ${result[0].id}]`);
            embed.setColor('#FF0000');
            embed.addField(`Информация о владельце заведения`, `**Владелец: <@${result[0].owner}>\nОписание: ${result[0].description}**`);
            embed.addField(`Основная информация о магазине`, `**Статус заведения: ${result[0].status}\nПродаваемый товар: ${result[0].name}\nЦена за 1 штуку: ${result[0].cost} ₯\nКоличество товара: ${result[0].amount}\nДенег в магазине: ${result[0].money} ₯**`);
            embed.addField(`Основная информация о складе`, `**Предметов на складе: ${result[0].storage}\nЦена за 1 штуку: ${result[0].storage_cost} ₯**`);
            embed.setFooter(`© Сopyright 2019`);
            message.reply(embed);
            return message.delete();
        });
    }

    if (message.content.startsWith("/change_status")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/change_status`).split(/ +/);
        if (!args[1] || !args[2]){
            message.reply(`\`использование: /change_status [номер заведения] [открыто/закрыто]\``);
            return message.delete();
        }
        if (!['открыто', 'закрыто'].includes(args[2])){
            message.reply(`\`использование: /change_status [номер заведения] [открыто/закрыто]\``);
            return message.delete();
        }
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`товар, который вы указали не найден или не ваш!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result[0].status == args[2]){
                message.reply(`\`магазин и так имеет статус: ${args[2]}!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`buy_dashboard\` SET status = '${args[2]}' WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
            message.reply(`\`вы успешно сменили магазину статус!\``).then(msg => msg.delete(12000));
            return message.delete();
        });
    }

    if (message.content.startsWith("/change_cost")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/change_cost`).split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /change_cost [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (!args[2]){
            message.reply(`\`использование: /change_cost [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (typeof (+args[2]) != "number" || +args[2] <= 0){
            message.reply(`\`использование: /change_cost [номер заведения] [сумма]\``);
            return message.delete();
        }
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`заведение, которое вы указали не найдено или не ваше!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`buy_dashboard\` SET cost = ${args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
            message.reply(`**изменения сохранены. Теперь товар стоит ${args[2]} ₯**`);
            return message.delete();
        });
    }

    if (message.content.startsWith("/get_money")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/get_money`).split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /get_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (!args[2]){
            message.reply(`\`использование: /get_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (typeof (+args[2]) != "number" || +args[2] <= 0){
            message.reply(`\`использование: /get_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`заведение, которое вы указали не найдено или не ваше!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result[0].status != 'закрыто'){
                message.reply(`\`магазин должен быть закрыт!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (args[2] > result[0].money){
                message.reply(`\`в магазине нет такого количества средств для снятия!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`SELECT \`id\`, \`userid\`, \`points\` FROM \`accounts\` WHERE \`userid\` = '${message.author.id}'`, async (error, result, packets) => {
                if (error) return console.error(error);
                if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
                if (result.length == 0){
                    connection.query(`INSERT INTO \`accounts\` (\`userid\`, \`points\`) VALUES ('${message.author.id}', '${args[2]}')`);
                    connection.query(`UPDATE \`buy_dashboard\` SET money = money - ${+args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
                    message.reply(`**вы успешно сняли с магазина ${args[2]} ₯**`);
                    return message.delete();
                }else{
                    connection.query(`UPDATE \`accounts\` SET points = points + ${+args[2]} WHERE \`userid\` = '${message.author.id}'`);
                    connection.query(`UPDATE \`buy_dashboard\` SET money = money - ${+args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
                    message.reply(`**вы успешно забрали с магазина ${args[2]} ₯**`);
                    return message.delete();
                }
            });
        });
    }

    if (message.content.startsWith("/add_money")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/add_money`).split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /add_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (!args[2]){
            message.reply(`\`использование: /add_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        if (typeof (+args[2]) != "number" || +args[2] <= 0){
            message.reply(`\`использование: /add_money [номер заведения] [сумма]\``);
            return message.delete();
        }
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`заведение, которое вы указали не найдено или не ваше!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result[0].status != 'закрыто'){
                message.reply(`\`магазин должен быть закрыт!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`SELECT * FROM \`accounts\` WHERE \`userid\` = '${message.author.id}'`, async (error, result, packets) => {
                if (error) return console.error(error);
                if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
                if (result.length == 0){
                    message.reply(`\`вы не можете добавить сумму, более чем у вас на аккаунте!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }else if (result[0].points < args[2]){
                    message.reply(`\`вы не можете добавить сумму, более чем у вас на аккаунте!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                connection.query(`UPDATE \`accounts\` SET points = points - ${+args[2]} WHERE \`userid\` = '${message.author.id}'`);
                connection.query(`UPDATE \`buy_dashboard\` SET money = money + ${+args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
                message.reply(`**вы успешно положили в магазин ${args[2]} ₯**`);
                return message.delete();
            });
        });
    }

    if (message.content.startsWith("/buy_amount")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/buy_amount`).split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /buy_amount [номер заведения] [кол-во]\``);
            return message.delete();
        }
        if (!args[2]){
            message.reply(`\`использование: /buy_amount [номер заведения] [кол-во]\``);
            return message.delete();
        }
        if (!isInteger(+args[2]) || +args[2] <= 0){
            message.reply(`\`использование: /buy_amount [номер заведения] [кол-во]\``);
            return message.delete();
        }
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`, async (err, result, fields) => {
            if (result.length < 1 || result.length > 1){
                message.reply(`\`заведение, которое вы указали не найдено или не ваше!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (args[2] > result[0].storage){
                message.reply(`\`на складе недостаточно товаров для пополнения! [storage: ${result[0].storage}]\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let cost = args[2] * result[0].storage_cost;
            if (cost > result[0].money){
                message.reply(`\`у вас недостаточно средств для покупки товаров! [money: ${result[0].money}]\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`buy_dashboard\` SET money = money - ${+cost} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
            connection.query(`UPDATE \`buy_dashboard\` SET storage = storage - ${+args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
            connection.query(`UPDATE \`buy_dashboard\` SET amount = amount + ${+args[2]} WHERE \`owner\` = '${message.author.id}' AND \`id\` = '${args[1]}'`);
            message.reply(`\`вы успешно пополнили количество товара!\``).then(msg => msg.delete(12000));
            return message.delete();
        });
    }

    if (message.content.startsWith("/get_market")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/get_market`).split(/ +/);
        if (!args[1]){
            message.reply(`**\`использование: /get_market [название товара]\`**`);
            return message.delete();
        }
        const name = args.slice(1).join(' ');
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`name\` = '${name}'`, async (err_mag, result_mag, fields_mag) => {
            if (result_mag.length < 1 || result_mag.length > 1){
                message.reply(`\`товар не найден!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result_mag[0].status == 'закрыто'){
                message.reply(`\`магазин временно закрыт владельцем!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            message.reply(`**\`название товара: ${result_mag[0].name}, описание: ${result_mag[0].description}, стоимость 1 штуки: ${result_mag[0].cost}, в наличии: ${result_mag[0].amount}\`**`);
            return message.delete();
        });
    }

    if (message.content.startsWith("/buy_market")){
        if (mysql_cooldown.has(message.author.id)){
            message.reply(`**\`попорбуйте через 8 секунд!\`**`).then(msg => msg.delete(7000));
            return message.delete();
        }
        mysql_cooldown.add(message.author.id);
        setTimeout(() => {
            if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
        }, 8000);
        const args = message.content.slice(`/buy_market`).split(/ +/);
        if (!args[1]){
            message.reply(`**\`использование: /buy_market [название товара]\`**`);
            return message.delete();
        }
        const name = args.slice(1).join(' ');
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`name\` = '${name}'`, async (err_mag, result_mag, fields_mag) => {
            if (result_mag.length < 1 || result_mag.length > 1){
                message.reply(`\`товар не найден!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result_mag[0].status == 'закрыто'){
                message.reply(`\`магазин временно закрыт владельцем!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (result_mag[0].amount <= 0){
                message.reply(`\`товар закончился! Вы не можете его приобрести!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`SELECT * FROM \`accounts\` WHERE \`userid\` = '${message.author.id}'`, async (error, result, packets) => {
                if (error) return console.error(error);
                if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
                if (result.length == 0){
                    message.reply(`**\`у вас недостаточно средств.\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                if (result[0].points < result_mag[0].cost){
                    message.reply(`**\`у вас недостаточно средств.\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                var answer = eval('(function() {\n' + result_mag[0].code + '\n}())');
                if (answer == '1'){
                    connection.query(`UPDATE \`accounts\` SET points = points - ${+result_mag[0].cost} WHERE \`userid\` = '${message.author.id}'`);
                    connection.query(`UPDATE \`buy_dashboard\` SET money = money + ${+result_mag[0].cost} WHERE \`name\` = '${name}'`);
                    connection.query(`UPDATE \`buy_dashboard\` SET amount = amount - 1 WHERE \`name\` = '${name}'`);
                    message.reply(`**\`вы успешно получили товар! [${name}]\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }else{
                    message.reply(`**\`ошибка при получении! [${name}]\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
            });
        });
    }
}