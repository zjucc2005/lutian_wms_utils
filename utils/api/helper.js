/**
 * 封装 - 存在性返回数据
 * @param response:Hash
 * @param label:String 标签名，用来描述msg
 * @param attr:String 字段名，用来返回已存在的数据相关字段值
 * @return {Hash}
 */
const response_with_existence = (response, label, attr) => {
    label = label || "数据对象"
    attr = attr || 'FName'
    let result = { status: -1, msg: '网络异常', data: [] }
    if (response.statusCode === 200) {
        if (response.data.length > 0) {
            let data = response.data.map(x => x[attr]) 
            result = { status: 1, msg: `${label}已存在`, data: data }
        } else {
            result = { status: 0, msg: `${label}不存在`, data: [] }
        }
    }
    return result
}

export {
    response_with_existence
}