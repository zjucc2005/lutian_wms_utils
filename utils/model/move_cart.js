
/**
 * 移库购物车模型
 * move_list[0] => { ...Inv, move_qty: 10, moved_qty: 0 }
 */
class MoveCart {
    constructor(options={}) {
        this.created_at = options.created_at || Date.now() // 创建日期
        this.move_list = options.move_list || []           // 待移库列表
    }
    
    static current() {
        return new MoveCart(uni.getStorageSync('move_cart') || {}) 
    }
    
    save() { uni.setStorageSync('move_cart', this) }
    
    destroy() { uni.removeStorageSync('move_cart') }
}