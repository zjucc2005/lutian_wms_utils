import { get_stock_loc_grid_name } from '@/utils'

class CcShelf {
    constructor(cc_grid, x_limit=null) {
        this.name = cc_grid.shelf
        this.x_limit = x_limit
        this.grids = []
        this.grids[cc_grid.y-1] ||= (x_limit ? new Array(x_limit) : [])
        this.grids[cc_grid.y-1][cc_grid.x-1] = cc_grid
    }    
    
    add_grid(cc_grid) {
        this.grids[cc_grid.y-1] ||= (this.x_limit ? new Array(this.x_limit) : [])
        this.grids[cc_grid.y-1][cc_grid.x-1] = cc_grid
    }
}

class CcGrid {
    constructor(stock_loc) {
        this.no = stock_loc.FNumber   // 库位号
        this.shelf = stock_loc.FGroup // 货架号/分组
        this.name = get_stock_loc_grid_name(stock_loc.FNumber, stock_loc.FGroup) // grid标识
        this.x = stock_loc.FPosX      // 横坐标
        this.y = stock_loc.FPosY      // 纵坐标      
        this.status = ''              // 状态
        this.style = 'default'        // 样式
        if (stock_loc.FForbidStatus == 'B') {
            this.status = 'forbidden'
            this.style = 'error'
        }
        this.sp = false               // 是否地面库位（特殊库位），默认否
        this.qty = 0                  // 库位数
        this.used = false             // 是否使用，默认否
    }
}

export { 
    CcShelf, 
    CcGrid
} 