import { is_loc_no_std_format, is_loc_no_std_sp_format} from '@/utils'

class CcShelf {
    constructor(cc_grid) {
        this.name = cc_grid.shelf
        this.grids = []
        this.grids[cc_grid.y-1] ||= []
        this.grids[cc_grid.y-1][cc_grid.x-1] = cc_grid
    }    
    
    add_grid(cc_grid) {
        this.grids[cc_grid.y-1] ||= []
        this.grids[cc_grid.y-1][cc_grid.x-1] = cc_grid
    }
}

class CcGrid {
    constructor(no) {
        if (is_loc_no_std_format(no)) {
            let arr = no.split('-')
            this.shelf = arr.slice(0,2).join('-')
            this.name = arr[2]
            this.x = arr[2].slice(1,3) * 1
            this.y = arr[2][0] * 1
        } else if (is_loc_no_std_sp_format(no)) {
            let arr = no.split('-')
            this.shelf = [arr[0], arr[1][0]].join('-')
            this.name = arr[1]
            this.x = arr[1].slice(1,3) * 1
            this.y = 1
        } else {
            this.shelf = no
            this.name = ''
            this.x = 1
            this.y = 1
        }
        // this.shelf = shelf   // 货架号/分组
        // this.name = name     // grid标识
        // this.x = x           // 横坐标
        // this.y = y           // 纵坐标
        this.no = no         // 库位号
        this.status = ''     // 状态
        this.style = ''      // 样式
        this.sp = false      // 是否地面库位（特殊库位），默认否
        this.qty = 0         // 库位数
        this.used = false    // 是否使用，默认否
    }
}

export { 
    CcShelf, 
    CcGrid
} 