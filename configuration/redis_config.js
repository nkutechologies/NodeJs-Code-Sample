'use strict';
const redis = require('redis');
const redisURL = "redis://:Ru01G27aKJNiNMA@10.142.15.206:6379";
const client = redis.createClient({url: redisURL});
//const client = redis.createClient({
//    host: '10.142.15.206',
//    port: 6379,
//    password: 'Ru01G27aKJNiNMA'
//});
//console.log('client config', client);
client.on('connect', async () => {
    console.log('Redis Client Connected');
//    await  client.configSet(
//         'requirepass',
//         'Ru01G27aKJNiNMA'
//     );
    //await client.sendCommand('AUTH', ['Ru01G27aKJNiNMA']);
    // client.select(0, function(err,res){
        
    // if(err){
    //     console.log("REDISDB ERROR:",err);
    // }else{
    //     console.log("REDISDB RESPONSE::",res);
    
    // }
    //   });
});
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();




module.exports = client;
