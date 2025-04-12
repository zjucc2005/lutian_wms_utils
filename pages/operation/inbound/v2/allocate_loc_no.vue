<template>
    <uni-section title="分配托盘库位" type="square"
        sub-title="点击选择可以分配的托盘库位"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        >
        <uni-list>
            <uni-list-item
                :show-extra-icon="true"
                :extra-icon="{ type: 'right',  color: '#007bff' }"
                title="已分配托盘数"
                :rightText="`${sum_plt_alloc()} / ${pallet_qty}`"
                >
            </uni-list-item>
        </uni-list>
        <uni-collapse>
            <uni-collapse-item
                v-for="shelf in grid_shelves"
                :title="shelf.name" open title-border="show"
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
                                        <view v-if="grid.checked">
                                            <uni-icons type="checkmarkempty" :size="grid_width * 0.5"></uni-icons>
                                            <view class="pallet_qty">{{ grid.plt_alloc }}</view>
                                        </view>
                                    </view>
                                </uni-grid-item>
                            </uni-grid>
                        </swiper-item>
                    </swiper>
                </view>
            </uni-collapse-item>
        </uni-collapse>
    </uni-section>

    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @button-click="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { is_loc_no_std_format } from '@/utils'
    export default {
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel()
            eventChannel.on('initStockLocs', res => {
                // this.$logger.info('eventChannel res:', res)
                this.stock_locs = res.stock_locs || []
                this.pallet_qty = res.pallet_qty || 0
                this.get_grid_shelves()
                this.get_grid_width()
            })
        },
        data() {
            return {
                stock_locs: [],
                pallet_qty: 0,
                grid_group_width: 0, // 设定 grid wrapper 宽度，在界面缩放后能保持原布局不乱
                grid_width: 0,       // 设定 grid 宽度，uni-grid组件里计算宽度有兼容性问题
                grid_shelves: [],
                allocate_info: [], // 分配的库位和对应托盘位数量， { no: '', plt_space: 2 }
                goods_nav: {
                    options: [
                        { icon: 'map-filled', text: '已分配', info: 0 }
                    ],
                    button_group: [
                        {
                            text: '返回',
                            backgroundColor: store.state.goods_nav_color.grey,
                            color: '#fff'
                        },
                        {
                            text: '预览',
                            backgroundColor: store.state.goods_nav_color.yellow,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        computed: {
            column() {
                if (store.state.system_info.windowWidth > 1000) {
                    return 30
                } else {
                    return 10
                }
            }
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data) // btn:查看已选库位
            },
            goods_nav_button_click(e) {
                if (e.index === 0) uni.navigateBack()
                if (e.index === 1) this.preview()
            },
            preview() {
                if (this.sum_plt_alloc() < this.pallet_qty) {
                    uni.showToast({ icon: 'none', title: `${this.pallet_qty - this.sum_plt_alloc()}个托盘未分配` })
                    return
                }
                const eventChannel = this.getOpenerEventChannel()
                eventChannel.emit('allocateInfo', { allocate_info: this.allocate_info })
                uni.navigateBack()
            },
            // 生成grid_shelves
            get_grid_shelves() {
                let grid_shelves = []
                this.stock_locs.forEach(stock_loc => {
                    let plt_space = stock_loc.FPalletSpace
                    // if (!stock_loc.idle && plt_space > 0 ) plt_space -= 1
                    if (is_loc_no_std_format(stock_loc.FNumber)) {
                        let loc_no_arr = stock_loc.FNumber.split('-')
                        let name = loc_no_arr.slice(0,2).join('-')
                        let x = loc_no_arr[2].slice(1,3) * 1
                        let y = loc_no_arr[2][0] * 1
                        let status = ''
                        let style = 'default'
                        if (stock_loc.FForbidStatus == 'B') {
                            status = 'forbidden'
                            style = 'error'
                            plt_space = 0
                        } else if (plt_space == 0) {
                            style = 'warn'
                        } else if (!stock_loc.idle) {
                            style = 'success'
                        }
                        let shelf = grid_shelves.find(s => s.name == name)
                        if (shelf) {
                            shelf.bound.x = Math.max(shelf.bound.x, x)
                            shelf.bound.y = Math.max(shelf.bound.y, y)
                            shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber, qty: 0, idle: stock_loc.idle, checked: false, plt_space: plt_space, plt_alloc: 0 })
                        } else {
                            grid_shelves.push({
                                name: name,
                                disabled: true,
                                bound: { x, y },
                                grids: [{ x, y, status, style, sp: false, no: stock_loc.FNumber, qty: 0, idle: stock_loc.idle, checked: false, plt_space: plt_space, plt_alloc: 0 }]
                            })
                        }
                    } else {
                        // 未分组/独立库位处理
                        let shelf = {
                            name: stock_loc.FNumber,
                            disabled: true,
                            bound: { x: 1, y: 1 },
                            grids:[{
                                x: 1, y: 1, 
                                status: stock_loc.FForbidStatus == 'B' ? 'forbidden' : '', 
                                style: stock_loc.FForbidStatus == 'B' ? 'error' : 'default', 
                                sp: true, no: stock_loc.FNumber,  qty: 0,
                                idle: stock_loc.idle, checked: false, plt_space: plt_space, plt_alloc: 0
                            }]
                        }
                        grid_shelves.push(shelf)
                    }
                })
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
                                grid.name = grid.sp ? '' : name
                                grid.no = grid.no || no
                            } else {
                                grid = { x, y, page, index, name, no, qty: 0, status: '', style: x > shelf.bound.x ? 'none' : 'default' }
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
            get_grid_width() {
                let screen_width = store.state.system_info.windowWidth
                this.grid_group_width = screen_width
                this.grid_width = (screen_width - 1) / this.column
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
                let window_width = store.state.system_info.windowWidth
                return Math.ceil(window_width / this.column * (shelf.bound.y + 0.7)) // swiper高度不会被内容撑开，需指定swiper高度
            },
            grid_click(e, shelf) {
                let grid = shelf.grids.find(g => g.index === e.detail.index)
                if (!grid) return
                if (grid.style == 'none') return
                // console.log('grid', grid)
                if (grid.plt_space == 0) return
                if (grid.checked) {
                    let rest_plt_alloc = this.pallet_qty - this.sum_plt_alloc()
                    if (grid.plt_alloc === grid.plt_space || rest_plt_alloc === 0) {
                        // 取消勾选
                        grid.checked = false
                        grid.plt_alloc = 0
                        let index = this.allocate_info.findIndex(x => x.no == grid.no)
                        if (index >= 0) this.allocate_info.splice(index, 1)
                    } else if (grid.plt_alloc < grid.plt_space) {
                        // 数量+1
                        grid.plt_alloc += 1
                        let info = this.allocate_info.find(x => x.no == grid.no)
                        info.plt_qty += 1
                    }
                } else {
                    // 勾选
                    let rest_plt_alloc = this.pallet_qty - this.sum_plt_alloc()
                    if (rest_plt_alloc === 0) {
                        uni.showToast({ icon: 'none', title: '分配库位已足够' })
                        return
                    }
                    grid.checked = true
                    if (grid.plt_space == -1) { 
                        grid.plt_alloc = rest_plt_alloc
                    } else {
                        grid.plt_alloc = 1
                        // grid.plt_alloc = Math.min(grid.plt_space, rest_plt_alloc)
                    }
                    this.allocate_info.push({ no: grid.no, plt_qty: grid.plt_alloc })
                }
                this.goods_nav.options[0].info = this.sum_plt_alloc()
            },
            sum_plt_alloc() {
                let sum = 0
                this.allocate_info.forEach(x => {
                    sum += x.plt_qty
                })
                return sum
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-collapse-item__title-text {
        font-size: $uni-font-size-lg !important;
        font-weight: bold;
    }
    
    .shelf_swiper {
        .grid-item-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-around; 
            align-items: center;
            // width: 100%;
            // height: 100%;
            padding: 0;
            border-radius: 5px;
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
                position: absolute;
                font-size: $uni-font-size-sm;
                top: 1px;
                left: 2px;
            }
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
