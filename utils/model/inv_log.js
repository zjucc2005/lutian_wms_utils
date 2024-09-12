import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 前端库存日志模型
 * options = {
 *   FOpType: 'in',
 *   FStockId: 1,
 *   FStockLocNo: 'T-B01-101',
 *   FMaterialId: 1,
 *   FOpQTY: 1,
 *   FBatchNo: '20240101',
 *   FBillNo: 'T001',
 *   FRemark: 'some remark',
 *   FOpStaffNo: '12345',
 *   FReferId: 1
 * }
 */
class InvLog {
    constructor(options={}) {
        this.FOpSN = store.state.snowflake.next_id()       
        this.FOpType = options.FOpType  // in, in_cl, out, out_cl
        this.FStockId = { FStockId: options.FStockId } 
        this.FStockLocId = { FNumber: options.FStockLocNo } 
        this.FMaterialId = { FMaterialId: options.FMaterialId }
        this.FOpQTY = options.FOpQTY
        this.FInvIncre = ['in_cl', 'out'].includes(options.FOpType) ? -options.FOpQTY : options.FOpQTY
        this.FBatchNo = options.FBatchNo
        this.FBillNo = options.FBillNo || ''
        this.FRemark = options.FRemark || ''
        this.FOpStaffNo = options.FOpStaffNo
        this.FReferId = ['in_cl', 'out_cl'].includes(options.FOpType) ? options.FReferId : ''    
    }
    
    /**
     * 保存库存日志（到数据库）
     * @return {Hash} Promise
     */
    save() {
        const data = {
            model: this
        }
        return K3CloudApi.save('PAEZ_C_INV_LOG', data)
    }
    
    /**
     * 批量保存库存日志（到数据库）
     * @param inv_logs:Array[InvLog]
     * @return {Hash} Promise
     */
    static batch_save(inv_logs=[]) {
        const data = {
            model: inv_logs,
            ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save('PAEZ_C_INV_LOG', data)
    }
    
    /**
     * 获取库存日志列表
     * @param options:Hash 参数集
     *   @field FID:Integer 主键ID
     *   @field FOpType_in:Array[String] 操作类型
     *   @field FStockId:Integer 仓库
     *   @field FBatchNo:String 批次号
     *   @field FBillNo:String 单据编号
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV_LOG",
            FilterString: []
        }
        if (options.FID) {
            data.FilterString.push({ Left: "", FieldName: "FID", Compare: "67", Value: options.FID, Right: "", Logic: 0 })
        }
        if (options.FOpType_in) {
            data.FilterString.push({ Left: "", FieldName: "FOpType", Compare: "338", Value: options.FOpType_in.join(','), Right: "", Logic: 0 })
        }
        if (options.FStockId) {
            data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.FStockId, Right: "", Logic: 0 })
        }
        if (options.FBatchNo) {
            data.FilterString.push({ Left: "", FieldName: "FBatchNo", Compare: "67", Value: options.FBatchNo, Right: "", Logic: 0 })
        }
        if (options.FBillNo) {
            data.FilterString.push({ Left: "", FieldName: "FBillNo", Compare: "67", Value: options.FBillNo, Right: "", Logic: 0 })
        }       
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        return K3CloudApi.bill_query(data)
    }
    
    static find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
}

export default InvLog