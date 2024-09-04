/**
 * JS版本的金蝶系统API SDK
 */
import store from '@/store'
import db_model from '@/utils/db_model'
import logger from '@/utils/logger'

const config = {
    endpoint: 'http://61.175.224.118:9090/',
    acctid: '668349890be80b',
    username: '陈伟斌',
    password: 'OA2024.',
    lcid: '2052'
}

const isConn = () => {
    return (store.state.conn_info && store.state.conn_expired_at && store.state.conn_expired_at > Date.now())
}

const fullURL = (path) => {
    return `${config.endpoint}k3cloud/${path}`
}

const fieldKeys = (model_name) => {
    return Object.getOwnPropertyNames(db_model[model_name].fields)
}

/**
 * API会话连接
 * @return { Hash } Promise
 */
const conn = async () => {
    return new Promise((resolve, reject) => {
        if (isConn()) {
            // logger.dev("load store.state.conn_info:", store.state.conn_info)
            return resolve(store.state.conn_info)
        }
        uni.request({
            url: fullURL('Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc'),
            method: 'POST',
            data: { acctid: config.acctid, username: config.username, password: config.password, lcid: config.lcid },
            success: (res) => {
                logger.dev("K3CloudApi.conn res:", res)
                store.commit('api_conn', res.data)
                resolve(res)
            },
            fail: (err) => {
                console.log("K3CloudApi.conn fail:", err)
                reject(err)
            }
        })
    })
}

/**
 * 查看表单数据接口
 * @param form_id:String 表单id，必须
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Number:String 单据编码，字符串类型（使用编码时必录）
 *   @field Id:String 表单内码（使用内码时必录）
 *   @field IsSortBySeq:Boolean 单据体是否按序号排序，默认false
 * @return { Hash } Promise
 */
const view = async (form_id, data) => {
    const _data_  = {
        CreateOrgId: 0,
        Number: "",
        Id: "",
        IsSortBySeq: false,
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.view req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc'),
                method: 'POST',
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.view res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.view fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 删除表单数据接口, delete为js关键字，方法名用_delete_以避免编译错误
 * @param form_id:String 表单id，必须
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Numbers:Array 单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
 *   @field Ids:String 单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
 *   @field NetworkCtrl:Boolean 是否启用网控，布尔类型，默认false（非必录）
 * @return { Hash } Promise
 */
const _delete_ = async (form_id, data) => {
    const _data_  = {
        CreateOrgId: 0,
        Numbers: [],
        Ids: "",
        NetworkCtrl: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.view req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Delete.common.kdsvc'),
                method: 'POST',
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.delete res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.delete fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 保存表单数据接口
 * @param form_id:String 表单Id，必须
 * @param data:Hash 必须
 *   @field NeedUpDateFields:Array 需要更新的字段，格式：[key1,key2,...]
 *   @field NeedReturnFields:Array 需返回结果的字段集合，格式：[key,entitykey.key,...]
 *   @field IsDeleteEntry:Boolean 是否删除已存在的分录，默认true
 *   @field SubSystemId:String 表单所在的子系统内码
 *   @field IsVerifyBaseDataField:Boolean 是否验证所有的基础资料有效性，默认false
 *   @field IsEntryBatchFill:Boolean 是否批量填充分录，默认true
 *   @field ValidateFlag:Boolean 是否验证数据合法性标志，默认true
 *   @field NumberSearch:Boolean 是否用编码搜索基础资料，默认true
 *   @field IsAutoAdjustField:Boolean 是否自动调整JSON字段顺序，默认false
 *   @field InterationFlags:String 交互标志集合，格式："flag1;flag2;..."
 *   @field IgnoreInterationFlag:String 是否允许忽略交互，默认true
 *   @field IsControlPrecision:Boolean 是否控制精度，为true时对金额、单价和数量字段进行精度验证，默认false
 *   @field ValidateRepeatJson:Boolean 校验Json数据包是否重复传入，一旦重复传入，接口调用失败，默认false
 *   @field model:Hash 表单数据包，JSON类型（必录）
 * @return { Array[Hash] } Promise
 */
const save = async (form_id, data) => {
    const _data_ = {
        // NeedReturnFields: fieldKeys(form_id),
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.save req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc'),
                method: 'POST',
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.save res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.save fail:", err)
                    reject(err)
                }
            })
        })
    })
}

/**
 * 批量保存表单数据接口
 * @param form_id:String 表单Id，必须
 * @param data:Hash 必须
 *   @field NumberSearch:Boolean 是否用编码搜索基础资料，默认true（非必录）
 *   @field ValidateFlag:Boolean 是否验证数据合法性标志，默认true（非必录）
 *   @field IsDeleteEntry:Boolean 是否删除已存在的分录，默认true（非必录）
 *   @field IsEntryBatchFill:Boolean 是否批量填充分录，默认true（非必录）
 *   @field NeedUpDateFields:Array 需要更新的字段，格式：[key1,key2,...] 
 *   @field NeedReturnFields:Array 需返回结果的字段集合，格式：[key,entitykey.key,...]
 *   @field SubSystemId:String 表单所在的子系统内码
 *   @field InterationFlags:String 交互标志集合，格式："flag1;flag2;..."（非必录） 例如（允许负库存标识：STK_InvCheckResult）
 *   @field model:Hash 表单数据包，JSON类型（必录）
 *   @field BatchCount:Integer 服务端开启的线程数，整型（非必录） 注（数据包数应大于此值，否则无效）
 *   @field IsVerifyBaseDataField:Boolean 是否验证所有的基础资料有效性，默认false
 *   @field IsAutoAdjustField:Boolean 是否自动调整JSON字段顺序，布尔类型，默认false（非必录）
 *   @field IgnoreInterationFlag:Boolean 是否允许忽略交互，布尔类型，默认true（非必录）
 *   @field IsControlPrecision:Boolean 是否控制精度，为true时对金额、单价和数量字段进行精度验证，默认false（非必录）
 *   @field ValidateRepeatJson:Boolean 校验Json数据包是否重复传入，一旦重复传入，接口调用失败，默认false（非必录）
*/
const batch_save = async (form_id, data) => {
    const _data_ = {
        // NeedReturnFields: fieldKeys(form_id),
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.save req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BatchSave.common.kdsvc'),
                method: 'POST',
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.batch_save res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.batch_save fail:", err)
                    reject(err)
                }
            })
        })
    })
}

/**
 * 查询表单数据接口
 * @param data:Hash
 *   @field FormId:String 业务对象表单Id（必录）
 *   @field FieldKeys:String 需查询的字段key集合，格式："key1,key2,..."（必录）
 *   @field FilterString:Array 过滤条件
 *   @field OrderString:String 排序条件
 *   @field TopRowCount:Integer 返回总行数
 *   @field StartRow 开始行索引，从0开始，例如每页10行数据，第2页开始是10，第3页开始是20
 *   @field Limit 最大行数，最大不能超过10000
 *   @field SubSystemId 表单所在的子系统内码
 * @return { Array[Array] } Promise
 */
const execute_bill_query = async (data) => {
    const _data_ = {
        FormId: "",
        FieldKeys: fieldKeys(data['FormId']).join(','),
        FilterString: [],
        OrderString: "",
        TopRowCount: 0,
        StartRow: 0,
        Limit: 2000,
        SubSystemId: '',
        ...data,
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.execute_bill_query req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc'),
                method: 'POST',
                data: { data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.execute_bill_query res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.execute_bill_query fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

/**
 * 查询表单数据接口(json)
 * @param data:Hash
 *   @field FormId:String 业务对象表单Id（必录）
 *   @field FieldKeys:String 需查询的字段key集合，字符串类型，格式："key1,key2,..."（必录）
 *   @field FilterString:Array 过滤条件
 *   @field OrderString:String 排序条件
 *   @field TopRowCount:Integer 返回总行数
 *   @field StartRow 开始行索引，从0开始，例如每页10行数据，第2页开始是10，第3页开始是20
 *   @field Limit 最大行数，最大不能超过10000
 *   @field SubSystemId 表单所在的子系统内码
 * @return { Array[Hash] } Promise
 */
const bill_query = async (data) => {
    const _data_ = {
        FormId: "",
        FieldKeys: fieldKeys(data['FormId']).join(','),
        FilterString: [],
        OrderString: "",
        TopRowCount: 0,
        StartRow: 0,
        Limit: 2000,
        SubSystemId: '',
        ...data,
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.dev("K3CloudApi.bill_query req:", _data_)
            uni.request({
                url: fullURL('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BillQuery.common.kdsvc'),
                method: 'POST',
                data: { data: _data_ },
                success: (res) => {
                    logger.dev("K3CloudApi.bill_query res:", res)
                    store.commit('reset_api_conn')
                    resolve(res)
                },
                fail: (err) => {
                    console.log("K3CloudApi.bill_query fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

const K3CloudApi = {
    conn,
    view,
    delete: _delete_,
    save,
    batch_save,
    execute_bill_query,
    bill_query
}

export default K3CloudApi