import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 发料用料日志模型
 * options = {
 *   FOpType: 'send',
 *   FStockId: 1,
 *   FMaterialId: 1,
 *   FSupplierId: 1,
 *   FOpQTY: 1,
 *   FBatchNo: '20240101',
 *   FBillNo: 'T001',
 *   FRemark: 'some remark',
 *   FOpStaffNo: '12345'
 * }
 */
class IssuemtrLog {
    constructor(options={}) {
        this.FOpSN = store.state.snowflake.next_id()       
        this.FOpType = options.FOpType  // send, receive
        this.FStockId = { FStockId: options.FStockId } 
        this.FMaterialId = { FMaterialId: options.FMaterialId }
        if (options.FSupplierId) this.FSupplierId = { FSupplierId: options.FSupplierId }
        this.FOpQTY = options.FOpQTY
        this.FBatchNo = options.FBatchNo
        this.FBillNo = options.FBillNo || ''
        this.FRemark = options.FRemark || ''
        this.FOpStaffNo = options.FOpStaffNo   
    }
    
    static FOpTypeEnum = {
        send: '发料',
        receive: '用料'
    }
    
    /**
     * 保存日志（到数据库）
     * @return {Hash} Promise
     */
    save() {
        const data = {
            model: this
        }
        return K3CloudApi.save('PAEZ_C_ISSUEMTR_LOG', data)
    }
    
    /**
     * 批量保存日志（到数据库）
     * @param issuemtr_logs:Array[InvLog]
     * @return {Hash} Promise
     */
    static batch_save(issuemtr_logs=[]) {
        const data = {
            model: issuemtr_logs,
            ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save('PAEZ_C_ISSUEMTR_LOG', data)
    }
    
    /**
     * 批量删除日志
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async delete(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.delete('PAEZ_C_ISSUEMTR_LOG', data)
    }
    
    /**
     * 获取日志列表
     * @param options:Hash 参数集
     *   @field FID:Integer 主键ID
     *   @field FOpType_in:Array[String] 操作类型
     *   @field FStockId:Integer 仓库
     *   @field FMaterialId:Integer 物料
     *   @field FMaterialId.FNumber:String 物料编号
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
            FormId: "PAEZ_C_ISSUEMTR_LOG",
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
        if (options.FMaterialId) {
            data.FilterString.push({ Left: "", FieldName: "FMaterialId", Compare: "67", Value: options.FMaterialId, Right: "", Logic: 0 })
        }
        if (options['FMaterialId.FNumber']) {
            data.FilterString.push({ Left: "", FieldName: "FMaterialId.FNumber", Compare: "67", Value: options['FMaterialId.FNumber'], Right: "", Logic: 0 })
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

export default IssuemtrLog