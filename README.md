# WMS APP using Kingdee API
## 
### 
 发布注意事项
 1.config.js
   - config.log 设置为 false;
 2.保持各处版本信息一致;
   - manifest.json
   - package.json
   - electron/package.json
 3.Android (*.apk) 发布
   - 运行 lutian_wms_admin，上传apk文件，填写版本和更新说明
 4.H5 (electron/*.exe) 发布
   - 上传文件到 https://musetransfer.com/
   - 修改 package.json 中 installPack.h5 下载地址
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
