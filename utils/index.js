import store from '@/store'

/**
 * 转换响应式数据到普通js对象
 */
const to_raw = (reactive_obj) => {
    return JSON.parse(JSON.stringify(reactive_obj));
}

/**
 * 四舍五入，不影响整数
 */
const math_round = (number, precision=0) => {
    if (Number.isInteger(number)) return number
    return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision)
}

/**
 * 播放提示音
 */
const play_audio = (src) => {
    let audio = uni.createInnerAudioContext()
    audio.src = src
    audio.play()
}

const play_audio_prompt = (type) => {
    let prompt_audio = uni.getStorageSync('prompt_audio') || 'on'
    if (prompt_audio == 'off') return
    const src = {
        success: '/static/audio/success.mp3',
        warn: '/static/audio/warn.mp3',
        delete: '/static/audio/delete.mp3'
    }[type]
    if (src) {
        play_audio(src)
    } else {
        throw new Error('invalid type')
    }
}

const link_to = (path) => {
    play_audio_prompt('success')
    uni.navigateTo({ url: path })
}

/**
 * 判断物料编码格式
 * @return {Boolean}
 */
const is_material_no_format = (text) => {
    const reg = /^\d+(\.\d+)+$/
    return !!text.match(reg)
}

/**
 * 判断库位号标准格式
 * 合法例子 AA，AA-A1, AA-A1-101
 * 不合法例子
 *   aa 大小写敏感
 *   AA_A1 分隔符只能用短横线 -
 *   AA--A1 分隔符不能连续
 *   AA-A1-001-01 分隔最多3段
 * @return {Boolean}
 */
const is_loc_no_std_format = (text) => {
    const reg = /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-\d{3}$/
    return !!text.match(reg)
}

// 解析库存号
// @return { depot: 'NX3', shelf: 'A01', col: 1, row: 1 }
const parse_loc_no = (loc_no) => {
    let arr = loc_no.split('-')
    let res = { depot: arr[0], shelf: arr[1] }
    if (arr[2]) {
        res.row = Number(arr[2][0])
        res.col = Number(arr[2].slice(1))
    }
    return res
}
// 比较两个库位号排序，优先级, 货架 > 列 > 行
// @return {-1, 1}
const compare_loc_no = (loc_no_x, loc_no_y) => {
    if (loc_no_x == loc_no_y) return 0
    let x = parse_loc_no(loc_no_x)
    let y = parse_loc_no(loc_no_y)
    if (x.depot < y.depot) return -1
    if (x.depot > y.depot) return 1
    if (x.shelf < y.shelf) return -1
    if (x.shelf > y.shelf) return 1
    if (x.col < y.col) return - 1
    if (x.col > y.col) return 1
    if (x.row < y.row) return -1
    if (x.row > y.row) return 1
    return 0
}

/**
 * 判断计量单位是否支持小数
 * @return {Boolean}
 */
const is_decimal_unit = (text) => {    
    const whitelist = ['立方米', '米', '秒', '平方米', '千克', '升']
    return whitelist.includes(text)
}

/**
 * 描述库存操作日志
 * @return String
 */
const describe_inv_log = (inv_log) => {
    let op_type_dict = {
        in: '上架',
        in_cl: '取消上架',
        out: '下架',
        out_cl: '取消下架'
    }
    let list = [
        `${op_type_dict[inv_log.FOpType]} ${inv_log.FOpQTY} ${inv_log['FStockUnitId.FName']} ${inv_log['FMaterialId.FNumber']}`,
        `${inv_log['FMaterialId.FName']}, ${inv_log['FMaterialId.FSpecification']}`,
        `库位 ${inv_log['FStockLocId.FNumber']} , 批次 ${inv_log.FBatchNo}`
    ]
    return list.join("\n")
}

// 注意：s2ab是一个辅助函数，用于将字符串转换为ArrayBuffer
const string_to_arraybuffer = (s) => {
  var buf = new ArrayBuffer(s.length)
  var view = new Uint8Array(buf)
  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF
  return buf
}

// 检查PC端更新
const get_latest_version = async (positive=false) => {
    // uni.showLoading({ title: 'Loading' })
    let res = await uni.request({
        url: 'https://zjucc2005.github.io/lutian_wms_utils/package.json',
        method: 'GET'
    })
    // uni.hideLoading()
    if (res.statusCode == 200) {
        store.commit('set_latest_version', res.data.versionCode)
        // #ifdef H5
        if (res.data.versionCode > store.state.system_info.appVersionCode) {
            uni.showModal({
                title: '发现新版本',
                content: 'PC版本需要自行下载安装包进行更新\n是否下载新版本安装包？',
                success: (e) => {
                    if (e.cancel) return
                    if (e.confirm) {
                        window.open(res.data.installPack.h5, '_blank') // 跳转至外部下载页面
                    }
                }
            })
        } else {
            if (positive) {
                // 主动检查更新时，返回提示
                uni.showModal({
                    title: '检查更新',
                    content: '已经是最新版本',
                    showCancel: false
                })
            }
        }
        // #endif
    }
}

export {
    to_raw,
    math_round,
    play_audio_prompt,
    link_to,
    is_material_no_format,
    is_loc_no_std_format,
    is_decimal_unit,
    compare_loc_no,
    describe_inv_log,
    string_to_arraybuffer,
    get_latest_version
}
