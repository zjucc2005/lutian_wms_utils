
/**
 * 移库购物车模型
 * move_list[0] => { inv: {Inv}, qty: 0 }
 */
class MoveCart {
    constructor(options={}) {
        this.created_at = options.created_at || Date.now() // 创建日期
        this.move_list = options.move_list || []           // 待移库列表
    }
}