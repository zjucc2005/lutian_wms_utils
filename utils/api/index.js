/**
 * 调用API的方法名，命名规则，模型或表名用 Example 示例
 * 查看 view: get_example
 * 查询 bill_query: get_examples
 * 保存 save: post_example
 * 批量保存 batch_save: post_examples
 * 删除 delete: delete_examples
 */
import K3CloudApi from "@/utils/k3cloudapi";

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

/** 
 * 员工登录认证
 * @return { Hash/undefined } Promise
 */
const validate_staff = async (staff_name, staff_no) => {
    const data = {
        FormId: "BD_WAREHOUSEWORKERS",
        FieldKeys: "FName,FNumber,FForbiddenStatus",
        FilterString: [
            {"Left":"","FieldName":"FName","Compare":"67","Value":staff_name,"Right":"","Logic":0},
            {"Left":"","FieldName":"FNumber","Compare":"67","Value":staff_no,"Right":"","Logic":0},
        ]
    }
    return K3CloudApi.bill_query(data).then(res => {  
        return Promise.resolve(res.data[0])
    })
}

/** 
 * 获取仓库基础数据
 * @return {Hash} Promise
 */
const get_bd_stocks = async () => {
    const data = {
        FormId: 'BD_STOCK',
        FieldKeys: "FStockId,FName,FNumber,FGroup,FGroup.FName",
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 获取计量单位基础数据
 * @return {Hash} Promise
 */
const get_bd_units = async () => {
    const data = {
        FormId: "BD_UNIT",
        FieldKeys: "FUnitId,FName,FNumber",
        FilterString: [
            { Left: "", FieldName: "FIsBaseUnit", Compare: "74", Value: true, Right: "", Logic: 0 },
            { Left: "", FieldName: "FDocumentStatus", Compare: "105", Value: "C", Right: "", Logic: 0 },
            { Left: "", FieldName: "FForbidStatus", Compare: "105", Value: "A", Right: "",Logic: 0 }
        ],
        OrderString: "FName ASC"
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 获取仓位列表
 * @param f_stock_id:Integer 仓库
 * @return {Hash} Promise
 */
const get_c_stock_locs = async (f_stock_id) => {
    const data = {
        FormId: "PAEZ_C_STOCK_LOC",
        FilterString: [
            { Left: "", FieldName: "FStockId", Compare: "67", Value: f_stock_id, Right: "", Logic: 0 }
        ]
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 获取仓位存在性，获取仓位列表的另一种形式
 * @param f_stock_id:Integer 仓库
 * @param loc_no:String 库位号
 * @return {Hash} Promise { status: -1/0/1/, msg: '网络异常/不存在/已存在',  }
 */
const exist_c_stock_locs = async (f_stock_id, loc_nos) => {
    const data = {
        FormId: "PAEZ_C_STOCK_LOC",
        FilterString: [
            { Left: "", FieldName: "FStockId", Compare: "67", Value: f_stock_id, Right: "", Logic: 0 },
            { Left: "", FieldName: "FNumber", Compare: "338", Value: loc_nos.join(','), Right: "", Logic: 0 }
        ]
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(response_with_existence(res, '库位号'))
    })
}

/** 
 * 新增仓位
 * @param model:Hash
 *   @field FName:String 名称
 *   @field FNumber:String 编码
 *   @field FStockId:Integer 仓库
 * @return {Hash} Promise
 */
const post_c_stock_loc = async (model) => {
    const data = {
        NeedReturnFields: ['FID', 'FDocumentStatus', 'FForbidStatus', 'FName', 'FNumber', 'FStockId', 'FCreateDate'],
        model: model
    }
    return K3CloudApi.save('PAEZ_C_STOCK_LOC', data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 新增仓位(批量)
 * @param model:Array
 *   @field FName:String 名称
 *   @field FNumber:String 编码
 *   @field FStockId:Integer 仓库
 * @return {Hash} Promise
 */
const post_c_stock_locs = async (model) => {
    const data = {
        NeedReturnFields: ['FID', 'FDocumentStatus', 'FForbidStatus', 'FName', 'FNumber', 'FStockId', 'FCreateDate'],
        model: model,
        ValidateRepeatJson: true
    }
    return K3CloudApi.batch_save('PAEZ_C_STOCK_LOC', data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 删除仓位(批量)
 * @param ids:Array 
 * @return {Hash} Promise
 */
const delete_c_stock_locs = async (ids) => {
    const data = {
        Ids: ids.join(',')
    }
    return K3CloudApi.delete('PAEZ_C_STOCK_LOC', data).then(res => {
        return Promise.resolve(res)
    })
}

export {
    validate_staff,
    get_bd_stocks,
    get_bd_units,
    get_c_stock_locs,
    exist_c_stock_locs,
    post_c_stock_loc,
    post_c_stock_locs,
    delete_c_stock_locs  
}