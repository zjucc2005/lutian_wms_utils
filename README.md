# WMS APP using Kingdee API
## 
### 
#### 
###### Author: Cai Chang

./config.js 配置文件模板
```javascript
export default {
    env: 'test',
    // log: true, // 是否打开调试日志
    kd_api: {
        test: {
            endpoint: 'http://test.k3cloud.com/',
            acctid: '1234567890',
            appname: 'K3cloud plugin',
            appid: '1234567_abcdefg...',
            appsecret: '1a2b3c4d5e6f7g...',
            username: 'Administrator',
            lcid: '2052',
            duration: 600 * 1000 // 会话持续时长，10 min
        },
        prod: {
            endpoint: 'http://prod.k3cloud.com/',
            acctid: '1234567890',
            appname: 'K3cloud plugin',
            appid: '1234567_abcdefg...',
            appsecret: '1a2b3c4d5e6f7g...',
            username: 'Administrator',
            lcid: '2052',
            duration: 600 * 1000
        }
    }
}
```
