const redis = require("redis");
const md5 = require("md5");
const assert = require("assert");
const {BAIDU_SECRET_KEY} = require("./config");
const {BAIDU_APP_ID} = require("./config");
const {TRANSLATE_SEP} = require("./config");
const {ONE_TIME_POP_NUM} = require("./config");
const {translateText} = require("./translations");
const {REDIS_INPUT_QUEUE_KEY} = require("./config");
const redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

redisClient.on("ready", function(error) {
    console.log("redis ready");
});

redisClient.on("error", function(error) {
    console.error(error);
});

const { promisify } = require("util");
const getAsync = promisify(redisClient.get).bind(redisClient);
const rPushAsync = promisify(redisClient.rpush).bind(redisClient);
const lPopAsync = promisify(redisClient.lpop).bind(redisClient);

setInterval(async ()=>{
    // const lRangeAsync = promisify(redisClient.lrange).bind(redisClient);
    // const lTrimAsync = promisify(redisClient.ltrim).bind(redisClient);
    // const executeAsync = promisify(p.execute).bind(p);
    const batch = redisClient.batch();
    batch.lrange(REDIS_INPUT_QUEUE_KEY, 0, ONE_TIME_POP_NUM - 1);
    batch.ltrim(REDIS_INPUT_QUEUE_KEY, ONE_TIME_POP_NUM, -1);
    batch.exec(async (err, reply)=>{
        if(reply !==  null && reply[0].length !== 0) {
            console.log("get "+ reply[0].length + " sentences from redis.")
            const toBeTranslated = reply[0].map(i=>JSON.parse(i).q).join('\n');
            const salt = (new Date).getTime();
            const str = BAIDU_APP_ID + toBeTranslated + salt + BAIDU_SECRET_KEY;
            const sign = md5(str);
            const translateRes = await translateText(toBeTranslated, salt, sign);
            if(translateRes.length !== reply[0].length){
                console.log(reply[0]);
            }
            assert(translateRes.length === reply[0].length);
            for (let i = 0; i < reply[0].length; i++) {
                redisClient.set(JSON.parse(reply[0][i]).sign, translateRes[i].dst);
            }
        }
    })
    // const data = executeAsync();

}, 2000)



module.exports = {
    redisClient,
    getAsync,
    rPushAsync,
    lPopAsync,
};
