<template>
    <uni-collapse :accordion="accordion">
        <uni-collapse-item
            v-for="(shelf, index) in grid_shelves"
            :title="shelf.name" :open="accordion ? index === 0 : open" :key="index" title-border="show"
            @click="console.log('this.$data', this.$data)"
            >
            <view class="content">
                <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                    <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                        <uni-grid
                            :column="column" 
                            :show-border="false" 
                            @change="grid_click($event, shelf)"
                            :style="{
                                width: grid_group_width + 'px'
                            }"
                            >
                            <uni-grid-item
                                v-for="grid in filter_swiper_grids(shelf, page)"
                                :key="grid.index"
                                :index="grid.index"
                                :style="{
                                    width: grid_width + 'px',
                                    height: grid_width + 'px'
                                }"
                                >
                                <view :class="['grid-item-box', grid.style]">
                                    <view class="name">{{ grid.name }}</view>
                                    <!-- <view v-if="grid.qty" class="qty">{{ grid.qty > 99999 ? '99999+' : grid.qty }}</view> -->
                                    <view v-if="grid.checked">
                                        <uni-icons type="checkmarkempty" :size="grid_width * 0.5"></uni-icons>
                                        <view class="pallet_qty">{{ grid.checked_qty }}</view>
                                    </view>
                                </view>
                            </uni-grid-item>
                        </uni-grid>
                    </swiper-item>
                </swiper>
            </view>
        </uni-collapse-item>
    </uni-collapse>
    
</template>

<script>
    /**
     * cc-shelf 网格化库位展示
     * @property {Array} stock_locs 库位数据
     * @property {Number} demand_qty 需求库位数
     * @property {Boolean} strict 严格模式
     * @property {Number} cols grid 固定列数
     * @property {Boolean} open = [true|false] 是否展开组件
     * @event {Function} click 点击 grid 触发事件
     * @example <cc-shelf :stock_locs="[]" open></cc-shelf>
     */
    
    import store from '@/store'
    export default {
        name:"cc-shelf-allocate",
        // emits: ['click'],
        props: {
            stock_locs: {
                type: Array,
                default: []
            },
            strict: {
                type: Boolean,
                default: true
            },
            demand_qty: {
                type: Number,
            },
            cols: {
                type: Number,
                default: 0,
            },
            open: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                grid_shelves: [],
                allocate_info: [],   // 分配的库位和对应托盘位数量， { no: '', v: 1 }
                grid_group_width: 0, // 设定 grid wrapper 宽度，在界面缩放后能保持原布局不乱
                accordion: uni.getStorageSync('shelf_accordion') === 'y'
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.get_grid_shelves()
            })
            uni.onWindowResize(res => {
                this.get_grid_shelves()
            })
        },
        computed: {
            column () {
                if (this.cols) return this.cols
                let res = Math.floor(store.state.system_info.windowWidth / 48)
                if (res < 10) res = 10
                return res
            },
            grid_width() {
                let screen_width = store.state.system_info.windowWidth
                this.grid_group_width = screen_width
                return (screen_width - 1) / this.column
            },
            checked_qty() {
                let sum = 0
                for (let info of this.allocate_info) {
                    sum += info.v
                }
                return sum
            }
        },
        methods: {
            get_grid_shelves() {
                // console.log('>>> get_grid_shelves()', this.stock_locs)
                let grid_shelves = []
                for (let stock_loc of this.stock_locs) {
                    let no = stock_loc.FNumber                // 编码
                    let shelf = stock_loc.FGroup              // 货架/分组
                    let name = no                             // 组内名称简称
                    if (no.startsWith(shelf)) {
                        name = no.substring(shelf.length, no.length)
                        if (name.startsWith('-')) name = name.substring(1, name.length)
                    }
                    let x = stock_loc.FPosX                   // 横坐标
                    let y = stock_loc.FPosY                   // 纵坐标
                    let status = ''                           // 状态
                    let style = 'default'                     // 样式
                    let qty = 0                               // 库存数
                    let plt_space = stock_loc.FPalletSpace    // 库位托盘容量
                    if (stock_loc.FForbidStatus == 'B') {
                        status = 'forbidden'
                        style = 'error'
                    } else if (plt_space == 0) {
                        style = 'warn'
                    } else if (plt_space == -1) {
                        style = 'default'
                    } else if (!stock_loc.idle) {
                        style = 'success'
                    }
                    let checked = false
                    let checked_qty = 0
                    let _alloc_info_ = this.allocate_info.find(info => info.no == no)
                    if (_alloc_info_) {
                        checked = true
                        checked_qty = _alloc_info_.v
                    }
                    
                    // let checked = this.allocate_info.some(info => info.no == no)
                    let grid_shelf = grid_shelves.find(s => s.name === stock_loc.FGroup)
                    if (grid_shelf) {
                        grid_shelf.bound.x = Math.max(grid_shelf.bound.x, stock_loc.FPosX)
                        grid_shelf.bound.y = Math.max(grid_shelf.bound.y, stock_loc.FPosY)
                        grid_shelf.grids.push({ no, shelf, name, x, y, status, style, qty, plt_space, checked, checked_qty })
                    } else {
                        grid_shelves.push({
                            name: shelf,
                            disabled: true,
                            bound: { x, y },
                            // loc_qty: { total: 0, used: 0, idle: 0, disabled: 0 },
                            grids: [{ no, shelf, name, x, y, status, style, qty, plt_space, checked, checked_qty }]
                        })
                    }
                }
                // 补全空缺的grid并赋予page + index
                grid_shelves.forEach(shelf => {
                    for(let x=1;x<=Math.ceil(shelf.bound.x/this.column)*this.column;x+=1) {
                        for(let y=1;y<=shelf.bound.y;y+=1) {
                            let { page, index } = this.get_grid_page_and_index(shelf.bound, { x, y })
                            let name = this.get_grid_name({x, y})
                            let no = [shelf.name, name].join('-')
                            let grid = shelf.grids.find(g => g.x == x && g.y == y)
                            if (grid) {
                                grid.page = page
                                grid.index = index
                                grid.no = grid.no || no
                            } else {
                                grid = { x, y, page, index, name, no, qty: 0, status: '', style: 'none' }
                                shelf.grids.push(grid)
                            }
                        }
                    }
                })
                grid_shelves.sort((x, y) => x.name >= y.name ? 1 : -1)
                this.grid_shelves = grid_shelves
                // return grid_shelves
            },
            // 设置grid所在页码，以及在整个货架中的索引
            get_grid_page_and_index(bound={}, coord={}) {
                let page = Math.ceil(coord.x / this.column)
                let index = (bound.y - coord.y) * Math.ceil(bound.x / this.column) * this.column + coord.x
                return { page, index }
            },
            // 设置grid名称
            get_grid_name(coord={}) {
                return coord.y * 100 + coord.x
            },
            // 过滤swiper单页中的grids对象
            filter_swiper_grids(shelf, page) {
                return shelf.grids.filter(g => g.page == page).sort((a,b) => a.index - b.index)
            },
            // 获取swiper总页数
            get_swiper_pages(shelf) {
                return Math.ceil(shelf.bound.x / this.column) 
            },
            // 获取屏幕宽度
            get_swiper_height(shelf) {
                return Math.ceil(this.grid_width * (shelf.bound.y + 0.6)) // swiper高度不会被内容撑开，需指定swiper高度
            },
            grid_click(e, shelf) {
                let grid = shelf.grids.find(g => g.index === e.detail.index)
                // console.log('grid', grid)
                if (!grid || grid.plt_space === 0 || ['error', 'none', 'warn'].includes(grid.style)) return
                if (this.strict) {
                    // 严格模式
                    if (['success'].includes(grid.style)) return
                }
                if (grid.checked) {
                    let rest_qty = this.demand_qty - this.checked_qty
                    if (grid.checked_qty === grid.plt_space || rest_qty === 0) {
                        // 取消勾选
                        let index = this.allocate_info.findIndex(x => x.no == grid.no)
                        if (index >= 0) this.allocate_info.splice(index, 1)
                        grid.checked = false
                        grid.checked_qty = 0
                    } else if (grid.checked_qty < grid.plt_space) {
                        // 数量+1
                        let info = this.allocate_info.find(x => x.no == grid.no)
                        info.v += 1
                        grid.checked_qty += 1
                    }
                } else {
                    // 勾选
                    let rest_qty = this.demand_qty - this.checked_qty
                    if (rest_qty === 0) {
                        uni.showToast({ icon: 'none', title: '分配库位已足够' })
                        return
                    }
                    
                    if (grid.plt_space == -1) { 
                        grid.checked_qty = rest_qty
                    } else {
                        grid.checked_qty = 1
                    }
                    grid.checked = true
                    this.allocate_info.push({ no: grid.no, v: grid.checked_qty })
                }
                this.$emit('update:modelValue', this.allocate_info) // 同步至父组件字段
            }
        }
    }
</script>

<style lang="scss" scoped>
    .shelf_swiper {
        .grid-item-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            // width: 100%;
            // height: 100%;
            padding: 0;
            border-radius: 3px;
            border: 1px solid #fff;
            &.default {
                background-color: $uni-text-color-disable;
            }
            &.success {
                background: linear-gradient(135deg, #4cd964, #67c23a);
                background-color: #67c23a;
            }
            &.info {
                background: linear-gradient(135deg, #55aaff, #3699fc);
                background-color: #409eff;
            }
            &.warn {
                background: linear-gradient(135deg, #f7ce50, #e6a23c);
                background-color: #e6a23c;
            }
            &.error {
                background: linear-gradient(135deg, #f56c6c, #FE6035);
                background-color: #f56c6c;
            }
            &.none {
                background-color: $uni-bg-color;
                .name {
                    color: $uni-bg-color;
                }
            }
            .name {
                width: 100%;
                font-size: $uni-font-size-sm;
                text-align: left;
                padding-left: 2px;
            }
            // .qty {
            //     width: 100%;
            //     color: #fff;
            //     font-size: $uni-font-size-base;
            //     font-weight: bold;
            //     text-align: right;
            // }
            .pallet_qty {
                position: absolute;
                font-size: $uni-font-size-base;
                font-weight: bold;
                bottom: 2px;
                right: 2px;
            }
        }
    }
</style>