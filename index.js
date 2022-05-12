const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sha1 = require('sha1');
const path = require('path');
const parseString = require('xml2js').parseString;
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const textMesg = (from, to, text) => {
  return `<xml>
            <ToUserName><![CDATA[${from}]]></ToUserName>
            <FromUserName><![CDATA[${to}]]></FromUserName>
            <CreateTime>${+new Date()}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[${text}]]></Content>
          </xml>`;
};

const config = {
  token: 'ABCDEFGHIJKLM',
  appid: 'wx303d946b8b18ebf4',
  secret: '0797b3d91472a32b59778af99066e045',
};

const user = ['oSU3W5grj8UzaAPvqCKHrKtVbdWE'];

// auth server
app.get('/', (req, res, next) => {
  const { signature, echostr, timestamp, nonce } = req.query;

  const result = [config.token, timestamp, nonce];

  result.sort();

  const sha1Result = sha1(result.join(''));

  res.send(echostr);
});

// 接受微信消息
app.post('/', (request, respose) => {
  request.on('data', (res) => {
    console.log('000');
    const xmlData = String(res);
    parseString(xmlData, (err, res) => {
      const from = res.xml.FromUserName;
      const to = res.xml.ToUserName;
      if (res.xml.Content[0] == '1') {
        respose.send(textMesg(from, to, from[0].substring(0, 4)));
      } else {
        respose.send(textMesg(from, to, '请输入code以获取验证码'));
      }
    });
  });
});

app.get('/userinfo', (req, res) => {
  const code = req.params.code;
  // 取数据中找
});

// let tick = '';

// app.get('/code', (req, res) => {
//   console.log(tick);
//   res.send({
//     tick: tick,
//   });
// });

// app.get('/erweima', async (req, res) => {
//   // 获取access_token
//   const access_token = await getAccess_token(); // access_token

//   // 请求二维码
//   axios
//     .post('https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + access_token, {
//       action_name: 'QR_LIMIT_SCENE',
//       action_info: '',
//       scene: {
//         scene_id: '1000',
//         scene_str: 'asdfasdf',
//         a: 20,
//       },
//     })
//     .then((result) => {
//       const { ticket } = result.data;
//       res.send({
//         url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`,
//       });
//     });
// });

// app.get('/signature', async (req, res) => {
//   const access_token = await getAccess_token();
//   let result = await getSignature(access_token);
//   res.send({
//     ticket: result.data.ticket,
//   });
// });

// function getSignature(accessToken) {
//   return new Promise((resolve, reject) => {
//     axios
//       .get(
//         `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
//       )
//       .then((res) => {
//         resolve(res);
//       });
//   });
// }

// function getAccess_token() {
//   return new Promise((resolve, reject) => {
//     axios
//       .get(
//         `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.secret}`
//       )
//       .then((res) => {
//         resolve(res.data.access_token);
//       });
//   });
// }

app.listen(80, () => {
  console.log('server is runing at 80');
});
