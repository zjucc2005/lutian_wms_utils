import store from '@/store';
import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'

/**
 * 前端入库任务模型
 * inbound_list[0] => {
 *   material_no: '1.2.3', material_name: 'name', material_spec: 'spec', base_unit_qty: 100, base_unit_name: 'Pcs',
 *   src_stock_id: 1, src_stock: '调出仓库'， dest_stock_id: 2, dest_stock: '调入仓库'
 * }
 */
class InboundTask {
    constructor(options={}) {
        this.created_at = options.created_at || Date.now() // 创建日期
        this.stock_id = options.stock_id                   // 仓库ID
        this.staff_no = options.staff_no                   // 员工编号
        this.inbound_date = options.inbound_date           // 入库日期
        this.batch_no = options.batch_no || formatDate(this.created_at, 'yyyyMMdd') // 批次号
        this.bill_no = options.bill_no                     // 单据编号
        this.inbound_list = options.inbound_list || []     // 入库总览，物料清单
    }
    
    static current() { return uni.getStorageSync('cur_inbound_task') || new this() }
    
    static destroy_all() { uni.removeStorageSync('cur_inbound_task') }
    
    save() { 
        uni.setStorageSync('cur_inbound_task', this)
        return this
    }
    
    destroy() { 
        uni.removeStorageSync('cur_inbound_task')
        return new this()
    }
    // 判断是否当前仓库
    is_cur_depot() { return store.state.cur_depot.FStockId === this.stock_id }
}

export default InboundTask