import store from '@/store';
import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'

/**
 * 前端入库任务模型
 * inbound_list[0] => {
 *   material_no: '1.2.3', material_name: 'name', material_spec: 'spec', base_unit_qty: 100, base_unit_name: 'Pcs',
 *   src_stock_id: 1, src_stock_name: '调出仓库', dest_stock_id: 2, dest_stock_name: '调入仓库'
 * }
 * pallet_infos[0] => {
 *   material_no: '1.2.3', material_name: 'name', material_spec: 'spec', base_unit_qty: 100, base_unit_name: 'Pcs',
 *   raw: '扫描信息', _id: '雪花算法'
 * }
 */
class InboundTask {
    constructor(options={}) {
        this.created_at = options.created_at || Date.now() // 创建日期
        this.stock_id = options.stock_id                   // 仓库ID
        this.stock_name = options.stock_name               // 仓库名称
        this.staff_no = options.staff_no                   // 员工编号
        this.inbound_date = options.inbound_date           // 入库日期
        this.category = options.category || 'bill'         // 入库任务类型, bill(default) / pallet / custom
        this.status = options.status || 'init'             // 入库任务状态, init / ongoing
        this.batch_no = options.batch_no || formatDate(this.created_at, 'yyyyMMdd') // 批次号
        this.bill_no = options.bill_no                     // 单据编号
        this.inbound_list = options.inbound_list || []     // 入库总览，物料清单
        this.pallet_infos = options.pallet_infos || []     // 入库托盘信息
    }
    
    static current() { return uni.getStorageSync('cur_inbound_task') }
    
    static destroy_all() { uni.removeStorageSync('cur_inbound_task') }
    
    save() { 
        uni.setStorageSync('cur_inbound_task', this)
        return this
    }
    
    destroy() { 
        uni.removeStorageSync('cur_inbound_task')
        return null
    }
    
    update(options={}) {
        Object.getOwnPropertyNames(options).forEach(k => {
            this[k] = options[k]
        })
        return this.save()
    }
    // 判断是否当前仓库
    is_cur_depot() { return store.state.cur_depot.FStockId === this.stock_id }
    
    add_pallet_info(info) {
        info._id = store.state.snowflake.next_id() 
        this.pallet_infos.unshift(info)
        let obj = this.inbound_list.find(x => x.material_id == info.material_id)
        if (obj) {
            obj.base_unit_qty += info.base_unit_qty
        } else {
            this.inbound_list.push({
                material_id: info.material_id,
                material_no: info.material_no,
                material_name: info.material_name,
                material_spec: info.material_spec,
                base_unit_qty: info.base_unit_qty,
                base_unit_name: info.base_unit_name,
                dest_stock_id: this.stock_id, 
                dest_stock_name: this.stock_name,
                batch_no: this.batch_no
            })
        }
        return this.save()
    }
    
    del_pallet_info(id) {
        let index = this.pallet_infos.findIndex(x => x._id == id)
        let info = this.pallet_infos[index]
        let obj = this.inbound_list.find(x => x.material_no == info.material_no)
        obj.base_unit_qty -= info.base_unit_qty
        if (obj.base_unit_qty <= 0) {
            let obj_index = this.inbound_list.findIndex(x => x.material_no == info.material_no)
            this.inbound_list.splice(obj_index, 1)
        }
        this.pallet_infos.splice(index, 1)
        return this.save()
    }
}

export default InboundTask