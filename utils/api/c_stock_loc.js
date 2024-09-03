import K3CloudApi from "@/utils/k3cloudapi";
import { response_with_existence } from "./helper"

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
 * @return {Hash} Promise { status: -1/0/1/, msg: '网络异常/不存在/已存在', data: [] }
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
    get_c_stock_locs,
    exist_c_stock_locs,
    post_c_stock_loc,
    post_c_stock_locs,
    delete_c_stock_locs
}