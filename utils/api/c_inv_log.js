import K3CloudApi from "@/utils/k3cloudapi";
import { response_with_existence } from "./helper"

/** 
 * 获取库存日志列表
 * @param options:Hash 参数集
 *   @field f_stock_id:Integer 仓库
 *   @field batch_no:String 批次号
 *   @field f_bill_no:String 单据编号
 * @return {Hash} Promise
 */
const get_c_inv_logs = async (options) => {
    const data = {
        FormId: "PAEZ_C_INV_LOG",
        FilterString: []
    }
    if (options.f_stock_id) {
        data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.f_stock_id, Right: "", Logic: 0 })
    }
    if (options.batch_no) {
        data.FilterString.push({ Left: "", FieldName: "FBatchNo", Compare: "67", Value: options.batch_no, Right: "", Logic: 0 })
    }
    if (options.f_bill_no) {
        data.FilterString.push({ Left: "", FieldName: "FBillNo", Compare: "67", Value: options.f_bill_no, Right: "", Logic: 0 })
    }
    return K3CloudApi.bill_query(data).then(res => {
        return Promise.resolve(res)
    })
}

/** 
 * 新增库存日志
 * @param model:Hash
 *   @field FOpSN:String 操作序列号(必填项)
 *   @field FOpType:String 库存操作类型(必填项)
 *   @field FStockId:Integer 仓库ID(必填项)
 *   @field FStockLocId:Integer 库位号ID(必填项)
 *   @field FMaterialId:Integer 物料编码ID(必填项)
 *   @field FOpQTY:Decimal 操作数量(必填项)
 *   @field FStockUnitId:Integer 计量单位(必填项)
 *   @field FInvIncre:Integer 库存变更数量(必填项)
 *   @field FBatchNo:String 库存批次号(必填项)
 *   @field FBillNo:String 单据编号
 *   @field FRemark:String 操作备注
 *   @field FOpStaffNo:String 操作员工编号
 *   @field FReferId:Integer 自关联ID(撤销操作的关联日志)
 * @return {Hash} Promise
 */
const post_c_inv_log = async (model) => {
    const data = {
        NeedReturnFields: ['FID', 'FOpSN', 'FNumber', 'FStockId', 'FCreateDate'],
        model: model
    }
    return K3CloudApi.save('PAEZ_C_INV_LOG', data).then(res => {
        return Promise.resolve(res)
    })
}


export {
    get_c_inv_logs
}