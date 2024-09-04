import store from '@/store';

/**
 * 前端出库任务模型
 */
class OutboundTask {
    constructor(options={}) {
        this.f_stock_id = options.f_stock_id;                // 仓库ID
        this.staff_no = options.staff_no;                    // 员工编号
        this.outbound_date = options.outbound_date;          // 出库日期
        this.batch_no = options.batch_no;                    // 批次号
        this.bill_no = options.bill_no;                      // 单据编号
        this.outbound_detail = options.outbound_detail || [] // 入库明细
    }
        
    save() {        
        uni.setStorageSync('cur_outbound_task', this)
    }
    
    destroy() {
        uni.removeStorageSync('cur_outbound_task')
    }
    // 判断是否当前仓库
    is_cur_depot() {
        return store.state.cur_depot.FStockId === this.f_stock_id
    }
    
    static current() {
        return uni.getStorageSync('cur_outbound_task')
    }
    static destroy_all() {
        uni.removeStorageSync('cur_outbound_task')
    }
}

export default OutboundTask