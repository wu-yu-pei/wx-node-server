const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sha1 = require('sha1');
const path = require('path');
const parseString = require('xml2js').parseString;
const app = express();
require('./redis');

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 模拟数据库
const users = []
// 模拟redis缓存
const redis = {}
var accessToken = ''

const textMesg = (from, to, text) => {
  return `<xml>
            <ToUserName><![CDATA[${from}]]></ToUserName>
            <FromUserName><![CDATA[${to}]]></FromUserName>
            <CreateTime>${+new Date()}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[${text}]]></Content>
          </xml>`;
};
// 配置信息
const config = {
  token: 'ABCDEFGHIJKLM',
  appid: 'wx231e6fc91ca26440',
  secret: '5d0efe03af9fa22c2ce1a6efdef441a8',
};

// 接受微信消息
app.post('/', (request, respose) => {
  request.on('data', (res) => {
    const xmlData = String(res);
    parseString(xmlData, (err, res) => {
      console.log(res, res.xml.Event);

      const from = res.xml.FromUserName;
      const to = res.xml.ToUserName;
      const type = res.xml.Event[0]
      const userName = res.xml.FromUserName[0]
      const EventKey = res.xml.EventKey[0]


      // 注册
      if (type === 'subscribe') {
        console.log(EventKey);
        console.log('关注了');
        // 创建用户
        const user = {
          open_id: userName,
        }
        users.push(user)
        if (isNaN(Number(EventKey))) {

          redis[EventKey.split('_')[1]] = user.open_id
        } else {
          redis[EventKey] = user.open_id
        }
        respose.send(textMesg(from, to, '感谢关注!'));
      }
      // 登录
      if (type === 'SCAN') {
        console.log('又来了');
        respose.send(textMesg(from, to, '欢迎回来!'));
      }
      // 取关
      if (type === 'unsubscribe') {
        console.log('取关了,应该删除用户信息');
      }
    });
  });
});


// 获取二维码
app.get('/erweima', async (req, res) => {
  // 获取access_token
  const access_token = await getAccess_token(config.appid, config.secret); // access_token
  accessToken = access_token
  const scene_id = Math.floor(Math.random() * 10000);

  // 请求二维码
  axios
    .post('https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + access_token,
      {
        action_name: 'QR_SCENE',
        expire_seconds: 60,
        action_info: {
          scene: {
            scene_id,
            scene_str: 'asdfasdf',
          },
        }
      }
    )
    .then((result) => {
      let { ticket } = result.data;
      res.send({
        url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`,
        scene_id,
      });
    });
});

// 检查是否登录
app.get('/check', async (req, res) => {
  const { scene_id } = req.query
  console.log(redis);
  if (redis[scene_id]) {
    let result = await getUserInfo(accessToken, redis[scene_id])
    res.send(result)
  } else {
    res.send('error')
  }
});

// 获取token
function getAccess_token(appid, secret) {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
      )
      .then((res) => {
        resolve(res.data.access_token);
      })
      .catch((err) => {
        console.log(err);
      });
  });
}

// 登录成功之后 获取用户信息
function getUserInfo(access_token, openid) {
  return new Promise((resolve, reject) => {
    axios.get(`https://api.weixin.qq.com/cgi-bin/user/info?access_token=${access_token}&openid=${openid}&lang=zh_CN`).then(res => {
      resolve(res.data)
    }).catch(err => {
      reject(err)
    })
  })
}
app.listen(80, () => {
  console.log('server is runing at 80');
});




// 获取二维码 ->　返回一个二维码和一个ｓｃｒｅ值 -> 关注后把这个值设置到redis里面 -> 前端沦陷检测redis是狗有值来确定用户是后关注 -> 若未关注过 {走注册流程} 否则走登录流程