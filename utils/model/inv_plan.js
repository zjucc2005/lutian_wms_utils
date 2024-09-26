import store from '@/store';
import K3CloudApi from '@/utils/k3cloudapi';

/**
 * 前端库存计划模型
 * options = {
 *   FOpType: 'in',
 *   FStockId: 1,
 *   FStockLocNo: 'T-B01-101',
 *   FDestStockLocNo: 'T-B01-102',
 *   FMaterialId: 1,
 *   FOpQTY: 1,
 *   FBatchNo: '20240101',
 *   FBillNo: 'T001',
 *   FRemark: 'some remark',
 *   FOpStaffNo: '12345',
 *   FReferId: 1
 * }
 */
class InvPlan {
    constructor(options={}) {
        this.FOpSN = store.state.snowflake.next_id()       
        this.FOpType = options.FOpType  // in, out, mv
        this.FStockId = { FStockId: options.FStockId } 
        this.FStockLocId = { FNumber: options.FStockLocNo }
        if(options.FDestStockLocNo) this.FDestStockLocId = { FNumber: options.FDestStockLocNo }
        this.FMaterialId = { FMaterialId: options.FMaterialId }
        this.FOpQTY = options.FOpQTY
        this.FInvIncre = 0
        this.FBatchNo = options.FBatchNo
        this.FBillNo = options.FBillNo
        this.FRemark = options.FRemark || ''
        this.FOpStaffNo = options.FOpStaffNo   
    }
    
    /**
     * 保存库存计划（到数据库）
     * @return {Hash} Promise
     */
    async save() {
        const data = {
            model: this
        }
        return K3CloudApi.save('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 批量保存库存计划（到数据库）
     * @param inv_plans:Array[InvPlan]
     * @return {Hash} Promise
     */
    static async batch_save(inv_plans=[]) {
        const data = {
            model: inv_plans,
            ValidateRepeatJson: true
        }
        return K3CloudApi.batch_save('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 批量删除库存计划
     * @param ids:Array
     * @return {Hash} Promise
     */
    static async delete(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.delete('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 获取库存计划列表
     * @param options:Hash 参数集
     *   @field FID:Integer 主键ID
     *   @field FDocumentStatus:String 单据状态
     *   @field FDocumentStatus_in:Array[String] 单据状态
     *   @field FOpType:String 操作类型
     *   @field FOpType_in:Array[String] 操作类型
     *   @field FStockId:Integer 仓库
     *   @field FMaterialId.FNumber:String 物料编号
     *   @field FBatchNo:String 批次号
     *   @field FBillNo:String 单据编号
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV_PLAN",
            FilterString: []
        }
        if (options.FID) {
            data.FilterString.push({ Left: "", FieldName: "FID", Compare: "67", Value: options.FID, Right: "", Logic: 0 })
        }
        if (options.FDocumentStatus) {
            data.FilterString.push({ Left: "", FieldName: "FDocumentStatu", Compare: "105", Value: options.FDocumentStatus, Right: "", Logic: 0})      
        }
        if (options.FDocumentStatus_in) {
            if (options.FDocumentStatus_in.length == 1) {
                data.FilterString.push({ Left: "", FieldName: "FDocumentStatu", Compare: "105", Value: options.FDocumentStatus_in[0], Right: "", Logic: 0})
            }
            if (options.FDocumentStatus_in.length > 1) {
                let filters = []
                options.FDocumentStatus_in.forEach(status => {
                    filters.push({ Left: "", FieldName: "FDocumentStatu", Compare: "105", Value: status, Right: "", Logic: 1 })
                })
                filters[0].Left = '('
                filters[filters.length - 1].Right = ')'
                filters[filters.length - 1].Logic = 0
                filters.forEach(filter => {
                    data.FilterString.push(filter)
                })
            }
        }
        if (options.FOpType) {
            data.FilterString.push({ Left: "", FieldName: "FOpType", Compare: "67", Value: options.FOpType, Right: "", Logic: 0 })
        }
        if (options.FOpType_in) {
            data.FilterString.push({ Left: "", FieldName: "FOpType", Compare: "338", Value: options.FOpType_in.join(','), Right: "", Logic: 0 })
        }
        if (options.FStockId) {
            data.FilterString.push({ Left: "", FieldName: "FStockId", Compare: "67", Value: options.FStockId, Right: "", Logic: 0 })
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
    
    static async find(id) {
        return this.query({ FID: id }, { limit: 1 })
    }
}

export default InvPlan