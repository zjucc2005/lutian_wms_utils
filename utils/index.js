import store from '@/store'

/**
 * 转换响应式数据到普通js对象
 */
const to_raw = (reactive_obj) => {
    return JSON.parse(JSON.stringify(reactive_obj));
}

/**
 * 播放提示音
 */
const play_audio = (src) => {
    let audio = uni.createInnerAudioContext()
    audio.src = src
    audio.play()
}

const play_audio_prompt = (type) => {
    const src = {
        success: '/static/audio/success.mp3',
        warn: '/static/audio/warn.mp3',
        delete: '/static/audio/delete.mp3'
    }[type]
    if (src) {
        play_audio(src)
    } else {
        throw new Error('invalid type')
    }
}

/**
 * 判断物料编码格式
 * @return {Boolean}
 */
const is_material_no_format = (text) => {
    const reg = /^\d+(\.\d+)+$/
    return !!text.match(reg)
}

/**
 * 判断库位号标准格式
 * 合法例子 AA，AA-A1, AA-A1-001
 * 不合法例子
 *   aa 大小写敏感
 *   AA_A1 分隔符只能用短横线 -
 *   AA--A1 分隔符不能连续
 *   AA-A1-001-01 分隔最多3段
 * @return {Boolean}
 */
const is_loc_no_std_format = (text) => {
    const reg = /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-\d{3}$/
    return !!text.match(reg)
}

/**
 * 判断计量单位是否支持小数
 * @return {Boolean}
 */
const is_decimal_unit = (text) => {    
    const whitelist = ['立方米', '米', '秒', '平方米', '千克', '升']
    return whitelist.includes(text)
}

/**
 * 描述库存操作日志
 * @return String
 */
const describe_inv_log = (inv_log) => {
    let op_type_dict = {
        in: '上架',
        in_cl: '取消上架',
        out: '下架',
        out_cl: '取消下架'
    }
    let list = [
        `${op_type_dict[inv_log.FOpType]} ${inv_log.FOpQTY} ${inv_log['FStockUnitId.FName']} ${inv_log['FMaterialId.FNumber']}`,
        `${inv_log['FMaterialId.FName']}, ${inv_log['FMaterialId.FSpecification']}`,
        `库位 ${inv_log['FStockLocId.FNumber']} , 批次 ${inv_log.FBatchNo}`
    ]
    return list.join("\n")
}

/**
 *  以下5个方法，为货架号swiper展示相关方法
 *  parse_stock_locs 解析库位号，按规则补空，高亮存在的grid
 *  parse_stock_locs_with_invs 解析库位号，按规则补空, 高亮有库存的grid，并统计库存数量
 *    get_grid_page_and_index 设置grid所在页码，以及在整个货架中的索引
 *    get_grid_name 设置grid名称
 *  filter_swiper_grids 过滤swiper单页中的grids对象
 *  get_swiper_pages 获取swiper总页数
 *  get_swiper_height 获取swiper高度
 */
const parse_stock_locs = (stock_locs=[]) => {
    let grid_shelves = []
    stock_locs.forEach(stock_loc => {
        if (is_loc_no_std_format(stock_loc.FNumber)) {
            let loc_no_arr = stock_loc.FNumber.split('-')
            let name = loc_no_arr.slice(0,2).join('-')
            let x = loc_no_arr[2].slice(0,2) * 1
            let y = loc_no_arr[2][2] * 1
            let status = ''
            let style = 'default'
            if (stock_loc.FForbidStatus != 'A') { 
                status = '已禁用'
                style = '' 
            } else if (stock_loc.FDocumentStatus != 'C') {
                status = '未审核'
                style = ''
            }
            let shelf = grid_shelves.find(d => d.name == name)
            if (shelf) {
                shelf.bound.x = Math.max(shelf.bound.x, x)
                shelf.bound.y = Math.max(shelf.bound.y, y)
                shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber })
            } else {
                grid_shelves.push({
                    name: name,
                    bound: { x, y },
                    grids: [{ x, y, status, style, no: stock_loc.FNumber }]
                })
            }
        } else {
            // 未分组的可以放这儿
        }
    })
    // 补全空缺的grid并赋予page + index
    grid_shelves.forEach(shelf => {
        for(let x=1;x<=Math.ceil(shelf.bound.x/10)*10;x+=1) {
            for(let y=1;y<=shelf.bound.y;y+=1) {
                let { page, index } = get_grid_page_and_index(shelf.bound, { x, y })
                let name = get_grid_name({x, y})
                let no = [shelf.name, name].join('-')
                let grid = shelf.grids.find(g => g.x == x && g.y == y)
                if (grid) {
                    grid.page = page
                    grid.index = index
                    grid.name = name
                } else {
                    grid = { x, y, page, index, name, no, status: '', style: x > shelf.bound.x ? 'none' : 'default' }
                    shelf.grids.push(grid)
                }
            }
        }
    })
    return grid_shelves
}

const parse_stock_locs_with_invs = (stock_locs=[], invs=[]) => {
    let grid_shelves = []
    stock_locs.forEach(stock_loc => {
        if (is_loc_no_std_format(stock_loc.FNumber)) {
            let loc_no_arr = stock_loc.FNumber.split('-')
            let name = loc_no_arr.slice(0,2).join('-')
            let x = loc_no_arr[2].slice(0,2) * 1
            let y = loc_no_arr[2][2] * 1
            let status = ''
            let style = 'default'
            let shelf = grid_shelves.find(d => d.name == name)
            if (shelf) {
                shelf.bound.x = Math.max(shelf.bound.x, x)
                shelf.bound.y = Math.max(shelf.bound.y, y)
                shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber, qty: 0 })
            } else {
                grid_shelves.push({
                    name: name,
                    disabled: true,
                    bound: { x, y },
                    grids: [{ x, y, status, style, no: stock_loc.FNumber, qty: 0 }]
                })
            }
        } else {
            // 未分组的可以放这儿
        }
    })
    invs.forEach(inv => {
        let loc_no_arr = inv['FStockLocId.FNumber'].split('-')
        let shelf = grid_shelves.find(s => s.name == loc_no_arr.slice(0,2).join('-'))
        if (shelf) {
            shelf.disabled = false
            let grid = shelf.grids.find(g => g.no == inv['FStockLocId.FNumber'])
            grid.style = 'success'
            grid.qty += inv.FQty
        }
    })
    // 补全空缺的grid并赋予page + index
    grid_shelves.forEach(shelf => {
        for(let x=1;x<=Math.ceil(shelf.bound.x/10)*10;x+=1) {
            for(let y=1;y<=shelf.bound.y;y+=1) {
                let { page, index } = get_grid_page_and_index(shelf.bound, { x, y })
                let name = get_grid_name({x, y})
                let no = [shelf.name, name].join('-')
                let grid = shelf.grids.find(g => g.x == x && g.y == y)
                if (grid) {
                    grid.page = page
                    grid.index = index
                    grid.name = name
                    grid.no = no
                } else {
                    grid = { x, y, page, index, name, no, qty: 0, status: '', style: x > shelf.bound.x ? 'none' : 'default' }
                    shelf.grids.push(grid)
                }
            }
        }
    })
    return grid_shelves
}
    
const get_grid_page_and_index = (bound={}, coord={}) => {
    let page = Math.ceil(coord.x / 10)
    let index = (bound.y - coord.y) * Math.ceil(bound.x / 10) * 10 + coord.x
    return { page, index }
}

const get_grid_name = (coord={}) => {
    let name = [coord.x, coord.y].join('')
    return coord.x < 10 ? `0${name}` : name
}

const filter_swiper_grids = (shelf, page) => {
    return shelf.grids.filter(g => g.page == page).sort((a,b) => a.index - b.index)
}

const get_swiper_pages = (shelf) => {
    return Math.ceil(shelf.bound.x / 10) // 获取swiper页面
}

const get_swiper_height = (shelf) => {
    let screen_width = store.state.system_info.windowWidth // 获取屏幕宽度
    return Math.ceil(screen_width / 10 * (shelf.bound.y + 0.7)) // swiper高度不会被内容撑开，需指定swiper高度
}

export {
    to_raw,
    play_audio_prompt,
    is_material_no_format,
    is_loc_no_std_format,
    is_decimal_unit,
    describe_inv_log,
    parse_stock_locs,
    parse_stock_locs_with_invs,
    filter_swiper_grids,
    get_swiper_pages,
    get_swiper_height
}
