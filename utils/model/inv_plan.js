import store from '@/store'
import K3CloudApi from '@/utils/k3cloudapi'
import InvLog from './inv_log'

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
 *   FPalletQty: 2
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
        this.FPalletQty = options.FPalletQty
        this.FReceiver = options.FReceiver
    }
    
    static FOpTypeEnum = {
        in:  '入库', // +
        out: '出库', // -
        mv:  '移库', // 0
        add: '增加', // +
        sub: '减少'  // -
    }
    
    /**
     * 保存库存计划（到数据库）
     * @return {Hash} Promise
     */
    async save() {
        if (!this.FMaterialId?.FMaterialId || !this.FOpQTY) {
            uni.showToast({ title: '参数错误' })
            return
        }
        const data = {
            model: this
        }
        return K3CloudApi.save('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 更新库存计划（到数据库）
     * @param options:Hash
     * @return {Hash} Promise
     */
    static async update(id, options={}) {
        const data = {
            model: {
                FID: id,
                ...options
            }
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
     * 批量提交库存计划（到数据库）
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async submit(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.submit('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 批量审核库存计划（到数据库）
     * @param ids:Array[Integer]
     * @return {Hash} Promise
     */
    static async audit(ids=[]) {
        const data = {
            Ids: ids.join(',')
        }
        return K3CloudApi.audit('PAEZ_C_INV_PLAN', data)
    }
    
    /**
     * 批量删除库存计划
     * @param ids:Array[Integer]
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
     *   @field FMaterialId.FNumber(_cont):String 物料编号
     *   @field FMaterialName(_cont):String 名称
     *   @field FModel(_cont):String 规格
     *   @field FBatchNo:String 批次号
     *   @field FBillNo(_ne):String 单据编号
     *   @field FCreateTime_(ge,le):String 
     * @param meta:Hash
     *   @field page:Integer
     *   @field per_page:Integer
     *   @field order:String
     * @return {Hash} Promise
     */
    static async query(options={}, meta={}) {
        const data = {
            FormId: "PAEZ_C_INV_PLAN",
            FilterString: K3CloudApi.query_filter(options)
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
    
    /**
     * 执行库存计划，生成库存变更日志
     * @param inv_plan:Hash 接口获取的数据库实例
     * @return {Hash} Promise
     */
    static async execute(inv_plan) {
        if (!inv_plan.FMaterialId) return // 变更计划中无物料信息时（数据错误），跳过生成日志
        if (['in', 'out', 'add', 'sub'].includes(inv_plan.FOpType)) {
            let options = {
                FOpType: inv_plan.FOpType,
                FStockId: inv_plan.FStockId,
                FStockLocNo: inv_plan['FStockLocId.FNumber'],
                FMaterialId: inv_plan.FMaterialId,
                FOpQTY: inv_plan.FOpQTY,
                FBatchNo: inv_plan.FBatchNo,
                FBillNo: inv_plan.FBillNo,
                FOpStaffNo: inv_plan.FOpStaffNo,
                FRemark: inv_plan.FRemark,
                FReceiver: inv_plan.FReceiver,
                FBillNo: inv_plan.FBillNo
            }
            let inv_log = new InvLog(options)
            await inv_log.save()
        }
        else if (inv_plan.FOpType == 'mv') {
            let src_options = {
                FOpType: 'mv_out',
                FStockId: inv_plan.FStockId,
                FStockLocNo: inv_plan['FStockLocId.FNumber'],
                FMaterialId: inv_plan.FMaterialId,
                FOpQTY: inv_plan.FOpQTY,
                FBatchNo: inv_plan.FBatchNo,
                FBillNo: inv_plan.FBillNo,
                FOpStaffNo: inv_plan.FOpStaffNo,
                FRemark: inv_plan.FRemark,
                FBillNo: inv_plan.FBillNo
            }
            let src_inv_log = new InvLog(src_options)
            await src_inv_log.save()
            let dest_options = {
                FOpType: 'mv_in',
                FStockId: inv_plan.FStockId,
                FStockLocNo: inv_plan['FDestStockLocId.FNumber'],
                FMaterialId: inv_plan.FMaterialId,
                FOpQTY: inv_plan.FOpQTY,
                FBatchNo: inv_plan.FBatchNo,
                FBillNo: inv_plan.FBillNo,
                FOpStaffNo: inv_plan.FOpStaffNo,
                FRemark: inv_plan.FRemark,
                FBillNo: inv_plan.FBillNo
            }
            let dest_inv_log = new InvLog(dest_options)
            await dest_inv_log.save()
        }
    }
}

export default InvPlan