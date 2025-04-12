import store from '@/store'
import K3CloudApi from '@/utils/k3cloudapi'

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
        this.FOpType = options.FOpType  // in, in_cl, out, out_cl, mv_in, mv_out, add, sub
        this.FStockId = { FStockId: options.FStockId } 
        this.FStockLocId = { FNumber: options.FStockLocNo } 
        this.FMaterialId = { FMaterialId: options.FMaterialId }
        this.FOpQTY = options.FOpQTY
        this.FInvIncre = ['in_cl', 'out', 'mv_out', 'sub'].includes(options.FOpType) ? -options.FOpQTY : options.FOpQTY
        this.FBatchNo = options.FBatchNo
        this.FBillNo = options.FBillNo || ''
        this.FRemark = options.FRemark || ''
        this.FOpStaffNo = options.FOpStaffNo
        this.FReferId = ['in_cl', 'out_cl'].includes(options.FOpType) ? options.FReferId : ''
        this.FReceiver = options.FReceiver || ''
    }
    
    static FOpTypeEnum = {
        in: '入库',           // +
        // in_cl: '入库-取消',   // -
        out: '出库',          // -
        // out_cl: '出库-取消',  // +
        mv_in: '移库上架',    // +
        mv_out: '移库下架',   // -
        add: '增加', // +
        sub: '减少'  // -
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
     * 批量删除
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async delete(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.delete('PAEZ_C_INV_LOG', data)
    }
    
    /**
     * 获取库存日志列表
     * @param options:Hash 参数集
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV_LOG",
            FilterString: K3CloudApi.query_filter(options)
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
    
    /**
     * 获取库存日志统计数据，考虑性能+数据全面性
     * @param options:Hash 参数
     *   @field FOpType_in:Array[String] 操作类型
     *   @field FStockId:Integer 仓库
     *   @field FCreateTime_ge:String 开始时间
     *   @field FCreateTime_lt:String 结束时间
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async inventory_record(options={}) {
        let meta = { page: 1, per_page: 10000, order: 'FCreateTime ASC' }
        let sum_data = []
        sum_data = await this._inventory_record_recurse(options, meta, sum_data)
        return sum_data
    } 
    static async _inventory_record_recurse(options={}, meta={}, sum_data=[]) {
        const data = {
            FormId: "PAEZ_C_INV_LOG",
            FieldKeys: ['FOpType', 'FInvIncre', 'FInvQty', 'FCreateTime'].join(','),
            FilterString: K3CloudApi.query_filter(options)
        }
        if (meta.per_page) {
            data.Limit = meta.per_page
            if (meta.page) data.StartRow = (meta.page - 1) * meta.per_page
        }
        if (meta.order) data.OrderString = meta.order
        let res = await K3CloudApi.execute_bill_query(data)
        sum_data = sum_data.concat(res.data)
        if (res.data.length === meta.per_page) {
            meta.page += 1 // 翻页
            return this._inventory_record_recurse(options, meta, sum_data)
        } else {
            return sum_data 
        }
    }
}

export default InvLog