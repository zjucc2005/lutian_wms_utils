function getLocalFilePath(path) {
  if (path.indexOf('_www') === 0 || path.indexOf('_doc') === 0 || path.indexOf('_documents') === 0 || path.indexOf(
      '_downloads') === 0) {
    return path
  }
  if (path.indexOf('file://') === 0) {
    return path
  }
  if (path.indexOf('/storage/emulated/0/') === 0) {
    return path
  }
  if (path.indexOf('/') === 0) {
    let localFilePath = plus.io.convertAbsoluteFileSystem(path)
    if (localFilePath !== path) {
      return localFilePath
    } else {
      path = path.substr(1)
    }
  }
  return '_www/' + path
}

function dataUrlToBase64(str) {
  let array = str.split(',')
  return array[array.length - 1]
}

let index = 0

function getNewFileId() {
  return Date.now() + String(index++)
}

function biggerThan(v1, v2) {
  let v1Array = v1.split('.')
  let v2Array = v2.split('.')
  let update = false
  for (let index = 0; index < v2Array.length; index++) {
    let diff = v1Array[index] - v2Array[index]
    if (diff !== 0) {
      update = diff > 0
      break
    }
  }
  return update
}

export function pathToBase64(path) {
  return new Promise(function(resolve, reject) {
    if (typeof window === 'object' && 'document' in window) {
      if (typeof FileReader === 'function') {
        let xhr = new XMLHttpRequest()
        xhr.open('GET', path, true)
        xhr.responseType = 'blob'
        xhr.onload = function() {
          if (this.status === 200) {
            let fileReader = new FileReader()
            fileReader.onload = function(e) {
              resolve(e.target.result)
            }
            fileReader.onerror = reject
            fileReader.readAsDataURL(this.response)
          }
        }
        xhr.onerror = reject
        xhr.send()
        return
      }
      let canvas = document.createElement('canvas')
      let c2x = canvas.getContext('2d')
      let img = new Image
      img.onload = function() {
        canvas.width = img.width
        canvas.height = img.height
        c2x.drawImage(img, 0, 0)
        resolve(canvas.toDataURL())
        canvas.height = canvas.width = 0
      }
      img.onerror = reject
      img.src = path
      return
    }
    if (typeof plus === 'object') {
      plus.io.resolveLocalFileSystemURL(getLocalFilePath(path), function(entry) {
        entry.file(function(file) {
          let fileReader = new plus.io.FileReader()
          fileReader.onload = function(data) {
            resolve(data.target.result)
          }
          fileReader.onerror = function(error) {
            reject(error)
          }
          fileReader.readAsDataURL(file)
        }, function(error) {
          reject(error)
        })
      }, function(error) {
        reject(error)
      })
      return
    }
    if (typeof wx === 'object' && wx.canIUse('getFileSystemManager')) {
      wx.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success: function(res) {
          resolve('data:image/png;base64,' + res.data)
        },
        fail: function(error) {
          reject(error)
        }
      })
      return
    }
    reject(new Error('not support'))
  })
}

export function base64ToPath(base64) {
  return new Promise(function(resolve, reject) {
    if (typeof window === 'object' && 'document' in window) {
      base64 = base64.split(',')
      let type = base64[0].match(/:(.*?);/)[1]
      let str = atob(base64[1])
      let n = str.length
      let array = new Uint8Array(n)
      while (n--) {
        array[n] = str.charCodeAt(n)
      }
      return resolve((window.URL || window.webkitURL).createObjectURL(new Blob([array], {
        type: type
      })))
    }
    let extName = base64.split(',')[0].match(/data\:\S+\/(\S+);/)
    if (extName) {
      extName = extName[1]
    } else {
      reject(new Error('base64 error'))
    }
    let fileName = getNewFileId() + '.' + extName
    if (typeof plus === 'object') {
      let basePath = '_doc'
      let dirPath = 'uniapp_temp'
      let filePath = basePath + '/' + dirPath + '/' + fileName
      if (!biggerThan(plus.os.name === 'Android' ? '1.9.9.80627' : '1.9.9.80472', plus.runtime.innerVersion)) {
        plus.io.resolveLocalFileSystemURL(basePath, function(entry) {
          entry.getDirectory(dirPath, {
            create: true,
            exclusive: false,
          }, function(entry) {
            entry.getFile(fileName, {
              create: true,
              exclusive: false,
            }, function(entry) {
              entry.createWriter(function(writer) {
                writer.onwrite = function() {
                  resolve(filePath)
                }
                writer.onerror = reject
                writer.seek(0)
                writer.writeAsBinary(dataUrlToBase64(base64))
              }, reject)
            }, reject)
          }, reject)
        }, reject)
        return
      }
      let bitmap = new plus.nativeObj.Bitmap(fileName)
      bitmap.loadBase64Data(base64, function() {
        bitmap.save(filePath, {}, function() {
          bitmap.clear()
          resolve(filePath)
        }, function(error) {
          bitmap.clear()
          reject(error)
        })
      }, function(error) {
        bitmap.clear()
        reject(error)
      })
      return
    }
    if (typeof wx === 'object' && wx.canIUse('getFileSystemManager')) {
      let filePath = wx.env.USER_DATA_PATH + '/' + fileName
      wx.getFileSystemManager().writeFile({
        filePath: filePath,
        data: dataUrlToBase64(base64),
        encoding: 'base64',
        success: function() {
          resolve(filePath)
        },
        fail: function(error) {
          reject(error)
        }
      })
      return
    }
    reject(new Error('not support'))
  })
}

/**
 * 图片地址转换为base64格式图片
 * @param {string} url 图片地址 网络地址 本地相对路径
 * @param {string} type base64图片类型 默认png
 */
export function urlToBase64(url, type = 'png') {
  let promises

  // 网络地址 或者h5端本地相对路径 可使用request方式
  promises = new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'GET',
      responseType: 'arraybuffer',
      success: (res) => {
        const base64 = `data:image/${type};base64,${uni.arrayBufferToBase64(res.data)}`
        resolve(base64);
      },
      fail: (err) => {
        reject(err);
      },
    })
  })

  // #ifdef APP
  if (!url.startsWith('http')) {
    // app真机本地相对路径
    promises = new Promise((resolve, reject) => {
      // 使用compressImage获取到安卓本地路径file:///...
      uni.compressImage({
        src: url,
        quality: 100,
        success: (res) => {
          const tempUrl = res.tempFilePath
          plus.io.resolveLocalFileSystemURL(tempUrl, (entry) => {
            entry.file((e) => {
              let fileReader = new plus.io.FileReader();
              fileReader.onload = (r) => {
                resolve(r.target.result)
              }
              fileReader.readAsDataURL(e)
            })
          })
        },
        fail: (err) => {
          reject(err);
        },
      })
    })
  }
  // #endif

  return promises
}