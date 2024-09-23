import { InvLog } from '@/utils/model'


/**
 * 移库购物车模型
 * move_list[0] => { inv: Inv, qty: 1/-1, created_at: Date.now() }
 *                 { inv: Inv, new_loc_no: 'T-B01-102', qty: 1, created_at: Date.now() }
 */
class MoveCart {
    constructor(options={}) {
        this.move_list = options.move_list || [] // 待移库列表
    }
    
    static current() {
        return new MoveCart(uni.getStorageSync('move_cart') || { move_list: [] }) 
    }
    
    save() { 
        uni.setStorageSync('move_cart', this)
        return this
    }
    
    destroy() { 
        uni.removeStorageSync('move_cart')
        return { move_list: [] }
    }
    
    update(new_item) {
        let exist_item = this.move_list.find(x => x.inv.FID == new_item.inv.FID && x.loc_no == new_item.loc_no)
        if (exist_item) {
            exist_item.qty = new_item.qty
            if (exist_item.qty == 0) {
                let index = this.move_list.indexOf(exist_item)
                if (index != -1) {
                    this.move_list.splice(index, 1)
                }
            }
        } else {
            if (new_item.qty == 0) {
                return this
            } else {
                this.move_list.push({ created_at: Date.now(), ...new_item })
            }
        }
        return this.save()
    }
    
    async exec(options={}) {
        try {
            for (let i = 0; i < this.move_list.length; i++) {
                let move_item = this.move_list[i]
                let mv_out_inv_log = new InvLog({
                    FOpType: 'mv_out',
                    FStockId: move_item.inv.FStockId,
                    FStockLocNo: move_item.inv['FStockLocId.FNumber'],
                    FMaterialId: move_item.inv.FMaterialId,
                    FOpQTY: move_item.qty,
                    FBatchNo: move_item.inv.FBatchNo,
                    FOpStaffNo: options.staff_no
                })
                await mv_out_inv_log.save()
                let mv_in_inv_log = new InvLog({
                    FOpType: 'mv_in',
                    FStockId: move_item.inv.FStockId,
                    FStockLocNo: move_item.loc_no, // 新 loc_no
                    FMaterialId: move_item.inv.FMaterialId,
                    FOpQTY: move_item.qty,
                    FBatchNo: move_item.inv.FBatchNo,
                    FOpStaffNo: options.staff_no,
                    FRemark: `${move_item.inv['FStockLocId.FNumber']} -> ${move_item.loc_no}`
                })
                await mv_in_inv_log.save()
                move_item.status = 'submitted'
                this.save()
            }
        } catch(err) {
            throw new Error(err)
        } finally {           
            this.move_list = this.move_list.filter(move_item => move_item.status != 'submitted')
            this.save() // 结束后清理缓存数据
        }
    }
    
    // append(new_item) {
    //     if (new_item.qty == 0) return this
    //     let exist_item = this.move_list.find(x => x.inv.FID == new_item.inv.FID && x.loc_no == new_item.loc_no)
    //     if (exist_item) {
    //         exist_item.qty += new_item.qty
    //     } else {
    //         this.move_list.push({ created_at: Date.now(), ...new_item })
    //     }
    //     return this.save()
    // }
}

export default MoveCart