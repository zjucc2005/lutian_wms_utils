/**
 * JS版本的金蝶系统API SDK
 */
import config from '@/config'
import store from '@/store'
import db_model from '@/utils/db_model'
import logger from '@/utils/logger'

let api_config = config.kd_api[config.env]

const set_header = () => {
    return { 'kdservice-sessionid': store.state.conn_info?.KDSVCSessionId }
}

const is_conn = () => {
    return (store.state.conn_info && store.state.conn_expired_at && store.state.conn_expired_at > Date.now())
}

const full_url = (path) => {
    return `${api_config.endpoint}k3cloud/${path}`
}

const default_field_keys = (model_name) => {
    return Object.getOwnPropertyNames(db_model[model_name]?.fields || {})
}

const conn = async () => {
    return conn_login_by_app_secret()
    // if (config.env == 'dev') {
    //     return conn_login_by_app_secret()
    // } else {
    //     return conn_validate_user()
    // }
}

/**
 * API会话连接，Secret方式
 * @return { Hash } Promise
 */
const conn_login_by_app_secret = async () => {
    return new Promise((resolve, reject) => {
        if (is_conn()) {
            return resolve(store.state.conn_info)
        }
        uni.request({
            url: full_url('Kingdee.BOS.WebApi.ServicesStub.AuthService.LoginByAppSecret.common.kdsvc'),
            method: 'POST',
            data: { 
                acctid: api_config.acctid, 
                username: api_config.username, 
                appid: api_config.appid,
                appsecret: api_config.appsecret,
                lcid: api_config.lcid ,
            },
            success: (res) => {
                logger.info(`>>> 运行环境[${config.env}]`)
                logger.info("K3CloudApi.conn_login_by_app_secret res:", res)
                store.commit('api_conn', res.data)
                resolve(res)
            },
            fail: (err) => {
                logger.info("K3CloudApi.conn_login_by_app_secret fail:", err)
                reject(err)
            }
        })
    })
}

/**
 * API会话连接，用户名密码方式
 * @return { Hash } Promise
 */
const conn_validate_user = async () => {
    return new Promise((resolve, reject) => {
        if (is_conn()) {
            return resolve(store.state.conn_info)
        }
        uni.request({
            url: full_url('Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc'),
            method: 'POST',
            data: { acctid: api_config.acctid, username: api_config.username, password: api_config.password, lcid: api_config.lcid },
            success: (res) => {
                logger.info(`运行环境[${config.env}]`)
                logger.info("K3CloudApi.conn_validate_user res:", res)
                store.commit('api_conn', res.data)
                resolve(res)
            },
            fail: (err) => {
                logger.info("K3CloudApi.conn_validate_user fail:", err)
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
            logger.info("K3CloudApi.view req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.View.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.view res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.view fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 提交表单数据接口
 * @param form_id:String 表单id，必须
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Numbers:Array 单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
 *   @field Ids:String 单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
 *   @field SelectedPostId:Integer 工作流发起员工岗位内码，整型（非必录） 注（员工身兼多岗时不传参默认取第一个岗位）
 *   @field UseOrgId:Integer 使用者组织内码（非必录）
 *   @field NetworkCtrl:Boolean 是否启用网控，布尔类型，默认false（非必录）
 *   @field IgnoreInterationFlag:Boolean 是否允许忽略交互，布尔类型，默认true（非必录）
 * @return { Hash } Promise
 */
const submit = async (form_id, data) => {
    const _data_  = {
        CreateOrgId: 0,
        Numbers: [],
        Ids: "",
        NetworkCtrl: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.submit req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Submit.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.submit res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.submit fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 审核表单数据接口
 * @param form_id:String 表单id，必须
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Numbers:Array 单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
 *   @field Ids:String 单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
 *   @field InterationFlags:String 交互标志集合，字符串类型，分号分隔，格式："flag1;flag2;..."（非必录） 例如（允许负库存标识：STK_InvCheckResult）
 *   @field UseOrgId:Integer 使用者组织内码（非必录）
 *   @field NetworkCtrl:Boolean 是否启用网控，布尔类型，默认false（非必录）
 *   @field IsVerifyProcInst:Boolean 是否检验单据关联运行中的工作流实例，布尔类型，默认true（非必录）
 *   @field IgnoreInterationFlag:Boolean 是否允许忽略交互，布尔类型，默认true（非必录）
 *   @field UseBatControlTimes:Boolean 是否应用单据参数设置分批处理，默认false
 * @return { Hash } Promise
 */
const audit = async (form_id, data) => {
    const _data_  = {
        Numbers: [],
        Ids: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.audit req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Audit.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.audit res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.audit fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 禁用表单数据接口
 * @param form_id:String 表单id，必须
 * @param opNumber:String 操作编码，字符串类型（必录）
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Numbers:Array 单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
 *   @field Ids:String 单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
 *   @field PkEntryIds:Array 单据内码与分录内码对应关系的集合，字符串类型，格式：[{"Id":"Id1","EntryIds":"EntryId1,EntryId2,..."}] (使用分录状态转换时必录)
 *   @field UseOrgId:Integer 使用者组织内码（非必录）
 *   @field NetworkCtrl:Boolean 是否启用网控，布尔类型，默认false（非必录）
 *   @field IgnoreInterationFlag:Boolean 是否允许忽略交互，布尔类型，默认true（非必录）
 * @return { Hash } Promise
 */
const forbid = async (form_id, data) => {
    const _data_  = {
        Numbers: [],
        Ids: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.forbid req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteOperation.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, opNumber: 'Forbid', data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.forbid res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.forbid fail:", err)
                    reject(err)
                }
            })
        })   
    })
}

/**
 * 反禁用表单数据接口
 * @param form_id:String 表单id，必须
 * @param opNumber:String 操作编码，字符串类型（必录）
 * @param data:Hash
 *   @field CreateOrgId:Integer 创建者组织内码（非必录）
 *   @field Numbers:Array 单据编码集合，数组类型，格式：[No1,No2,...]（使用编码时必录）
 *   @field Ids:String 单据内码集合，字符串类型，格式："Id1,Id2,..."（使用内码时必录）
 *   @field PkEntryIds:Array 单据内码与分录内码对应关系的集合，字符串类型，格式：[{"Id":"Id1","EntryIds":"EntryId1,EntryId2,..."}] (使用分录状态转换时必录)
 *   @field UseOrgId:Integer 使用者组织内码（非必录）
 *   @field NetworkCtrl:Boolean 是否启用网控，布尔类型，默认false（非必录）
 *   @field IgnoreInterationFlag:Boolean 是否允许忽略交互，布尔类型，默认true（非必录）
 * @return { Hash } Promise
 */
const enable = async (form_id, data) => {
    const _data_  = {
        Numbers: [],
        Ids: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.enable req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteOperation.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, opNumber: 'Enable', data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.enable res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.enable fail:", err)
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
        Numbers: [],
        Ids: "",
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.delete req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Delete.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.delete res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.delete fail:", err)
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
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.save req:", _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.Save.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.save res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.save fail:", err)
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
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            logger.info("K3CloudApi.save req:", form_id, _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BatchSave.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { formid: form_id, data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.batch_save res:", res)
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.batch_save fail:", err)
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
        FieldKeys: default_field_keys(data['FormId']).join(','),
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
            let t1 = Date.now()
            logger.info("K3CloudApi.execute_bill_query req:", _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.ExecuteBillQuery.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.execute_bill_query res:", res)
                    logger.info('K3CloudApi.execute_bill_query cost', Date.now() - t1, 'ms')
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.execute_bill_query fail:", err)
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
        FieldKeys: default_field_keys(data['FormId']).join(','),
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
            let t1 = Date.now()
            logger.info("K3CloudApi.bill_query req:", _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.BillQuery.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.bill_query res:", res)
                    logger.info('K3CloudApi.bill_query cost', Date.now() - t1, 'ms')
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.bill_query fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

/**
 * 上传附件接口
 * @param data:Hash
 *   @field FileName:String 文件名，必填
 *   @field IsLast:Boolean 是否最后一次上传，必填
 *   @field SendByte:String Base64 后的文件字节流，必填
 * @return { String } Promise
 */
const upload_file = async (data) => {
    const _data_ = {
        IsLast: true,
        ...data
    }
    return conn().then(_ => {
        return new Promise((resolve, reject) => {
            let t1 = Date.now()
            logger.info("K3CloudApi.upload_file req:", _data_)
            uni.request({
                url: full_url('Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.UploadFile.common.kdsvc'),
                method: 'POST',
                header: set_header(),
                data: { data: _data_ },
                success: (res) => {
                    logger.info("K3CloudApi.upload_file res:", res)
                    logger.info('K3CloudApi.upload_file cost', Date.now() - t1, 'ms')
                    resolve(res)
                },
                fail: (err) => {
                    logger.info("K3CloudApi.upload_file fail:", err)
                    reject(err)
                }
            })
        })    
    })
}

/**
 * 下载文件接口
 * @param file_id:String
 * @return { String } Promise
 */
const download_url = (file_id, nail=0) => {
    return conn().then(_ => {
        let token = store.state.conn_info?.Context?.UserToken
        return full_url(`FileUpLoadServices/Download.aspx?fileId=${file_id}&token=${token}&nail=${nail}`)
    })
}
const download_url_sync = (file_id, nail=0) => {
    let token = store.state.conn_info?.Context?.UserToken
    return full_url(`FileUpLoadServices/Download.aspx?fileId=${file_id}&token=${token}&nail=${nail}`)
}
const thumbnail_url = (file_id, default_url='/static/default_40x40.png') => {
    return file_id?.trim() ? download_url_sync(file_id, 1, true) : default_url
}


/**
 * Helper - 组装查询条件，返回查询SQL
 * @param options:Hash 查询条件Object
 * @return {String}
 */
const query_filter = (options = {}) => {
    let filters = []
    for (let k of Object.getOwnPropertyNames(options)) {
        let { field, compare } = match_suffix(k)
        if (options[k] instanceof Date) options[k] = options[k].toLocaleString() // Date实例转成String
        switch (compare) {
            case 'eq': filters.push(`${field} = '${options[k]}'`);                         break;
            case 'ne': filters.push(`${field} != '${options[k]}'`);                        break;
            case 'gt': filters.push(`${field} > '${options[k]}'`);                         break;
            case 'ge': filters.push(`${field} >= '${options[k]}'`);                        break;
            case 'lt': filters.push(`${field} < '${options[k]}'`);                         break;
            case 'le': filters.push(`${field} <= '${options[k]}'`);                        break;
            case 'lk': filters.push(`${field} LIKE '%${options[k]}%'`);                    break;
            case 'sw': filters.push(`${field} LIKE '${options[k]}%'`);                     break;
            case 'ew': filters.push(`${field} LIKE '%${options[k]}'`);                     break;
            case 'in': filters.push(`${field} IN (${options[k].map(x => `'${x}'`)})`);     break;
            case 'ni': filters.push(`${field} NOT IN (${options[k].map(x => `'${x}'`)})`); break;
        }
    }
    return filters.join(' AND ')
}

/**
 * Helper - 匹配查询方式（后缀）
 * @param text:String
 * @return {String} 返回查询SQL
 */
const match_suffix = (text) => {
    /**
     * eq  等于  equal to
     * ne  不等于  not equal to
     * gt  大于  greater than
     * ge  大于等于  greater than or equal to
     * lt  小于  less than
     * le  小于等于  less than or equal to
     * lk  相似:字符串  like (case_sensitive: false)
     * sw  开头 start with
     * ew  结尾 end with
     * in  包含于:数组  in
     * ni  不包含于:数组  not in
     */
    const suffix_list = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'lk', 'sw', 'ew', 'in', 'ni']
    let m = text.match(new RegExp(`(.+)_(${suffix_list.join('|')})`))
    if (!m) return { field: text, compare: 'eq' }
    return { field: m[1], compare: m[2] }
}


const K3CloudApi = {
    conn,
    full_url,
    view,
    submit,
    audit,
    forbid,
    enable,
    delete: _delete_,
    save,
    batch_save,
    execute_bill_query,
    bill_query,
    upload_file,
    download_url,
    download_url_sync,
    thumbnail_url,
    query_filter
}

export default K3CloudApi