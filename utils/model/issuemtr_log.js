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
        if (options.FID) this.FID = options.FID
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
    
    cancel(staff_no) {
        const data = {
            model: {
                FID: this.FID,
                FOpType: this.FOpType + '_cl',
                FRemark: `${(new Date()).toISOString()} 被[${staff_no}]取消`
            }
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
     *   @field FMaterialId.FNumber(_cont):String 物料编号
     *   @field FMaterialName(_cont):String 名称
     *   @field FModel(_cont):String 规格
     *   @field FBatchNo:String 批次号
     *   @field FBillNo(_in):String 单据编号
     *   @field FCreateTime_(ge,le):String 
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_ISSUEMTR_LOG",
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
     * 获取日志统计数据，考虑性能+数据全面性
     * @param options:Hash 参数
     *   @field FOpType_in:Array[String] 操作类型
     *   @field FMaterialId.FNumber:String
     *   @field FBatchNo:String
     *   @field FCreateTime_ge:String 开始时间
     *   @field FCreateTime_lt:String 结束时间
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async summary(options={}) {
        let meta = { page: 1, per_page: 10000, order: 'FCreateTime ASC' }
        let sum_data = []
        sum_data = await this._summary_recurse(options, meta, sum_data)
        return sum_data
    } 
    static async _summary_recurse(options={}, meta={}, sum_data=[]) {
        const data = {
            FormId: "PAEZ_C_ISSUEMTR_LOG",
            FieldKeys: ['FOpType', 'FOpQTY', 'FCreateTime'].join(','),
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
            return this._summary_recurse(options, meta, sum_data)
        } else {
            return sum_data 
        }
    }
    
}

export default IssuemtrLog