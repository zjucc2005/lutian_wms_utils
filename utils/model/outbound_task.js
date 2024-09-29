import store from '@/store';

/**
 * 前端出库任务模型
 * outbound_list[0] => { 
 *   material_no: '1.2.3', material_name: 'name', material_spec: 'spec', base_unit_qty: 100, base_unit_name: 'Pcs'
 * }
 */
class OutboundTask {
    constructor(options={}) {
        this.created_at = options.created_at || Date.now() // 创建日期
        this.stock_id = options.stock_id                   // 仓库ID
        this.staff_no = options.staff_no                   // 员工编号        
        this.bill_no = options.bill_no                     // 单据编号
        this.outbound_list = options.outbound_list || []   // 出库总览，物料清单
    }
   
    static current() { return uni.getStorageSync('cur_outbound_task') || {} }
    
    static destroy_all() { uni.removeStorageSync('cur_outbound_task') }
        
    save() { 
        uni.setStorageSync('cur_outbound_task', this)
        return this
    }
    
    destroy() {
        uni.removeStorageSync('cur_outbound_task')
        return {}
    }
    // 判断是否当前仓库
    is_cur_depot() { return store.state.cur_depot.FStockId === this.stock_id }    
}

export default OutboundTask
