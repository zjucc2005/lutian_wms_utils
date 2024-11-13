// 选择图片封装方法
const choose_image = async (options) => {
    return new Promise((resolve, reject) => {        
        uni.chooseImage({
            count: 1, // 最多可以选择的图片张数
            // sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图
            // sourceType: ['album', 'camera'],
            ...options,
            success: (res) => {
                console.log('chooseImage succ', res)
                // #ifdef APP-PLUS
                    const { tempFilePaths, tempFiles } = res
                    for (let tempFile of tempFiles) {
                        let arr = tempFile.path.split('/')
                        tempFile.name = arr[arr.length - 1]
                    }
                    resolve({ tempFilePaths, tempFiles })
                // #endif
                // #ifdef H5
                    resolve(res)
                // #endif
            },
            fail: (err) => {
                console.log('chooseImage fail', err)
                reject(err)
            },
            complete: (res) => {
            }
        })
    })  
}

// 将文件二进制流转成Base64
const read_file_as_base64 = async (url) => {
    return new Promise((resolve, reject) => {
        // #ifdef APP-PLUS
            plus.io.resolveLocalFileSystemURL(
                url, 
                (entry) => {
                    entry.file(file => {
                        let fileReader = new plus.io.FileReader()
                        fileReader.onloadend = (e) => {
                            console.log('plus fileReader', e)
                            const base64_data = e.target.result.split(',')[1]
                            resolve(base64_data) 
                        }
                        fileReader.readAsDataURL(file)
                    })
                }, 
                (err) => { 
                    reject(err.message)
                }
            )
        // #endif
        // #ifdef H5
            uni.request({
                url: url,
                method: 'GET',
                responseType: 'arraybuffer',
                success: (res) => {
                    let base64_data = uni.arrayBufferToBase64(res.data)
                    resolve(base64_data)
                },
                fail: (err) => {
                    reject(err)
                }
            })
        // #endif
    })
}

export {
    choose_image,
    read_file_as_base64
}