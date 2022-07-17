const axios = require('axios');
const {REDIS_INPUT_QUEUE_KEY} = require("./config");


const {
    GOOGLE_TRANSLATION_API,
    GOOGLE_API_KEY,
    BAIDU_TRANSLATION_API,
    BAIDU_APP_ID,
    BAIDU_SECRET_KEY
} = require("./config");


async function translateText(q, salt, sign, from = 'auto', to = 'zh') {
    // try{
    //     let [translations] = await translate.translate(q, target);
    //     return translations;
    // }catch (e) {
    //     return undefined;
    // }
    const response = await axios.get(BAIDU_TRANSLATION_API, {
        params: {
            q,
            from,
            to,
            appid: BAIDU_APP_ID,
            salt,
            sign,
        },
        headers: {'Content-Type': 'application/json'}
    });
    if(response.status!==200 || response.data.trans_result === undefined){
        console.error(response.data);
        if (response.data.error_code === 54003){
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
        }
        // console.error(q);
        return await translateText(q, salt, sign);
    }else{
        const translateRes = response.data.trans_result;
        console.log('successfully translated 20 sentences');
        return translateRes;
    }
    // const response = await translate(q, {from:'en', to:"zh"});
    // console.log(response);
}

// (async ()=>{
//     setInterval(async ()=>{
//         try{
//             await translateText("how are you?");
//         }catch (e) {
//             console.error(e)
//         }
//     }, 1000)
// })().then()

module.exports = {
    translateText,
}
