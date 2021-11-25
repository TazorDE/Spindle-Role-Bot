require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const csv = require('csv-parser');
const cron = require('node-cron');

//get DISCORD_BOT_TOKEN from .env
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
//create a new Discord client
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS] });
client.login(DISCORD_BOT_TOKEN);

let discord_name_regex = new RegExp(/.{1,32}#\d{4}/g);

const usernames = [];
const new_username_list = [];
const emails = [];
const not_found = [];
const email_not_found = [];

client.once('ready', () => {
    //running every 5 hours
    cron.schedule('0 */5 * * *', () => {
        fs.createReadStream('database.csv')
            .pipe(csv())
            .on('data', (data) => { usernames.push(data.discord); })
            .on('end', () => {
                fs.createReadStream('database.csv')
                    .pipe(csv())
                    .on('data', (data) => { emails.push(data.mail); })
                    .on('end', async() => {

                        //loop through all usernames and emails
                        for (let i = 0; i < usernames.length; i++) {
                            //if username matches discord_name_regex remove last 4 characters
                            if (usernames[i] && usernames[i].match(discord_name_regex)) {
                                new_username_list[i] = usernames[i].slice(0, -5);
                            }else{
                                new_username_list[i] = usernames[i];
                            }
                        }
                        await set_roles();
                    });
            });
        return;
    });             
});


async function set_roles(){
    const guild = client.guilds.cache.get('822127214413086770');
    const members = await guild.members.fetch();
    const memberNames = members.map(member => member.user.username);
    for (let i = 0; i < new_username_list.length; i++) {
        if (!memberNames.includes(new_username_list[i])) {
            console.log(`${new_username_list[i]} not found in guild`);
            not_found.push(usernames[i]);
            email_not_found.push(emails[i]);
        } else {
            const member = guild.members.cache.find(member => member.user.username === new_username_list[i]);
            //set role "Kickstarter Backer" for user
            ksrole = guild.roles.cache.find(role => role.name == 'Kickstarter Backer');
            if(!member) return;
            if(!ksrole) return;
            await member.roles.add(ksrole);
        }
    }
    //combine not_found and email_not_found arrays to object array
    let combined = [];
    for (let i = 0; i < not_found.length; i++) {
        combined.push({ discord: not_found[i], mail: email_not_found[i] });
    }
    //write combined array to file
    fs.writeFile('not_found.json', JSON.stringify(combined), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    console.log(  `${not_found.length} usernames not found in guild`);
    console.log(  `${usernames.length - not_found.length} roles assigned`);

}