/**
 * 封装多平台兼容的扫码方法
 */
// #ifdef APP-PLUS
const myScanCode = uni.requireNativePlugin('My-ScanCode')
// #endif
const scan_code = () => {
    return new Promise((resolve, reject) => {
        // #ifdef H5
            return reject('PC版不支持扫码')
        // #endif
        // #ifdef APP-PLUS
            myScanCode.scanCode({}, (res) => {
                if (res.success == 'true') {
                    resolve({ platform: 'plugin', result: res.result, data: res })
                }
            })
        // #endif               
        // #ifndef APP-PLUS
            uni.scanCode({
                success: (res) => {
                    resolve({ platform: 'uni', result: res.result, data: res })
                }
            })
        // #endif
    })
}

export default scan_code