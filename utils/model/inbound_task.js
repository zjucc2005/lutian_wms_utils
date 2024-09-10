import store from '@/store';

/**
 * 前端入库任务模型
 */
class InboundTask {
    constructor(options={}) {
        this.created_at = Date.now()                   // 创建日期
        this.f_stock_id = options.f_stock_id           // 仓库ID
        this.staff_no = options.staff_no               // 员工编号
        this.inbound_date = options.inbound_date       // 入库日期
        this.batch_no = options.batch_no               // 批次号
        this.bill_no = options.bill_no                 // 单据编号
        this.inbound_list = options.inbound_list || [] // 入库总览，物料清单
    }
    
    static current() { return uni.getStorageSync('cur_inbound_task') }
    
    static destroy_all() { uni.removeStorageSync('cur_inbound_task') }
    
    save() { uni.setStorageSync('cur_inbound_task', this) }
    
    destroy() { uni.removeStorageSync('cur_inbound_task') }
    // 判断是否当前仓库
    is_cur_depot() { return store.state.cur_depot.FStockId === this.f_stock_id }
}

export default InboundTask