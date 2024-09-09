import store from '@/store';

/**
 * 前端出库任务模型
 * outbound_list => [ { material_no: '1.2.3', material_name: 'name', material_spec: 'spec', qty: 100, base_unit: 'Pcs' } ]
 * outbound_detail => [ Inv ]
 * outbound_operation => [InvLog]
 */
class OutboundTask {
    constructor(options={}) {
        this.created_at = Date.now()                     // 创建日期
        this.f_stock_id = options.f_stock_id             // 仓库ID
        this.staff_no = options.staff_no                 // 员工编号        
        this.bill_no = options.bill_no                   // 单据编号
        this.outbound_list = options.outbound_list || [] // 出库总览，物料清单
        // this.outbound_detail = []                     // 出库明细
        // this.oubbound_operation = []                  // 出库操作
    }
   
    static current() { return uni.getStorageSync('cur_outbound_task') }
    
    static destroy_all() { uni.removeStorageSync('cur_outbound_task') }
        
    save() { uni.setStorageSync('cur_outbound_task', this) }
    
    destroy() { uni.removeStorageSync('cur_outbound_task') }
    // 判断是否当前仓库
    is_cur_depot() { return store.state.cur_depot.FStockId === this.f_stock_id }    
}

// 需持久化
class OutboundOperation {
    constructor(data) {
        this.data = data || []
    }
}

export default OutboundTask
