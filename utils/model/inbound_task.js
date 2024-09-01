import store from '@/store';

/**
 * 前端入库任务模型
 */
class InboundTask {
    constructor(options={}) {
        this.f_stock_id = 0;                      // 仓库ID
        // this.staff_no = 2817;                     // 员工编号
        this.inbound_date = options.inbound_date; // 入库日期
        this.batch_no = options.batch_no;         // 批次号
        this.f_bill_no = options.f_bill_no;       // 单据编号
        this.inv_logs = []                        // 操作日志
    }
    
    append_inv_log(inv_log) {
        this.inv_logs.push(inv_log)
    }
        
    save() {        
        uni.setStorageSync('cur_inbound_task', this)
    }
    
    destroy() {
        uni.removeStorageSync('cur_inbound_task')
    }
    // 判断是否当前仓库
    is_cur_depot() {
        return store.state.cur_depot.FStockId === this.f_stock_id
    }
    
    static current() {
        return uni.getStorageSync('cur_inbound_task')
    }
    static destroy_all() {
        uni.removeStorageSync('cur_inbound_task')
    }
}

export default InboundTask