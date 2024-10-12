<template>
    <uni-collapse>
        <uni-collapse-item
            v-for="shelf in grid_shelves"
            :title="shelf.name" :open="open" title-border="show"
            >
            <view class="content">
                <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                    <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                        <uni-grid :column="column" :show-border="false" @change="grid_click($event, shelf)">
                            <uni-grid-item
                                v-for="grid in filter_swiper_grids(shelf, page)"
                                :key="grid.index"
                                :index="grid.index"
                                >
                                <view :class="['grid-item-box', grid.style]">
                                    <view class="name">{{ grid.name }}</view>
                                    <view v-if="grid.qty" class="qty">{{ grid.qty > 9999 ? '9999+' : grid.qty }}</view>
                                </view>
                            </uni-grid-item>
                        </uni-grid>
                    </swiper-item>
                </swiper>
            </view>
        </uni-collapse-item>
    </uni-collapse>
    
    <uni-drawer ref="inv_drawer" mode="left" :width="320" >
        <uni-section :title="`库位：${drawer_loc_no}`" type="square">
            <template v-slot:right>
                <view class="uni-section__right">
                    <uni-icons type="closeempty" size="24" color="#333" @click="drawer_close"/>
                </view>
            </template>
            <uni-list>
                <uni-list-item
                    v-for="(inv, index) in invs.filter(x => x['FStockLocId.FNumber'] == drawer_loc_no)"
                    :key="index"
                    :title="inv['FMaterialId.FNumber']"
                    :note="[
                        `名称：${inv['FMaterialId.FName']}`, 
                        `规格：${inv['FMaterialId.FSpecification']}`, 
                        `批次：${inv.FBatchNo}`
                    ].join('\n')"
                    :rightText="[inv.FQty, inv['FStockUnitId.FName']].join(' ')"
                    >
                </uni-list-item>
            </uni-list>
        </uni-section>
    </uni-drawer>
</template>

<script>
    /**
     * cc-shelf 网格化库位展示
     * @property {Array} invs 库存数据
     * @property {Number} column grid 列数
     * @property {Boolean} open = [true|false] 是否展开组件
     * @property {Boolean} onlyInv = [true|false] 是否只展示有库存的货架
     * @event {Function} click 点击 grid 触发事件
     * @example <cc-shelf :stock_locs="[]" :invs="[{...}]" open></cc-shelf>
     */
    
    import store from '@/store'
    export default {
        name:"cc-shelf",
        // emits: ['click'],
        props: {
            stock_locs: {
                type: Array,
                default: []
            },
            invs: {
                type: Array,
                default: []
            },
            column: {
                type: Number,
                default: 10
            },
            onlyInv: {
                type: Boolean,
                default: false
            },
            open: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                drawer_loc_no: ''
            }
        },
        computed: {
            grid_shelves() {
                let grid_shelves = []
                this.stock_locs.forEach(stock_loc => {
                    if (this.is_loc_no_std_format(stock_loc.FNumber)) {
                        let loc_no_arr = stock_loc.FNumber.split('-')
                        let name = loc_no_arr.slice(0,2).join('-')
                        let x = loc_no_arr[2].slice(0,2) * 1
                        let y = loc_no_arr[2][2] * 1
                        let status = ''
                        let style = 'default'
                        let shelf = grid_shelves.find(s => s.name == name)
                        if (shelf) {
                            shelf.bound.x = Math.max(shelf.bound.x, x)
                            shelf.bound.y = Math.max(shelf.bound.y, y)
                            shelf.grids.push({ x, y, status, style, no: stock_loc.FNumber, qty: 0 })
                        } else {
                            grid_shelves.push({
                                name: name,
                                disabled: true,
                                bound: { x, y },
                                grids: [{ x, y, status, style, sp: false, no: stock_loc.FNumber, qty: 0 }]
                            })
                        }
                    } else {
                        // 未分组/独立库位处理
                        grid_shelves.push({
                            name: stock_loc.FNumber,
                            disabled: true,
                            bound: { x: 1, y: 1 },
                            grids:[{ x: 1, y: 1, status: '', style: 'default', sp: true, no: stock_loc.FNumber, qty: 0}]
                        })
                        
                    }
                })
                this.invs.forEach(inv => {
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
                
                if (this.onlyInv) {
                    return grid_shelves.filter(shelf => !shelf.disabled)
                } else {
                    return grid_shelves
                }
            }
        },
        methods: {    
            is_loc_no_std_format(text) {
                const reg = /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-\d{3}$/
                return !!text.match(reg)
            },
            // 设置grid所在页码，以及在整个货架中的索引
            get_grid_page_and_index(bound={}, coord={}) {
                let page = Math.ceil(coord.x / this.column)
                let index = (bound.y - coord.y) * Math.ceil(bound.x / this.column) * this.column + coord.x
                return { page, index }
            },
            // 设置grid名称
            get_grid_name(coord={}) {
                let name = [coord.x, coord.y].join('')
                return coord.x < 10 ? `0${name}` : name
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
                let screen_width = store.state.system_info.windowWidth
                return Math.ceil(screen_width / this.column * (shelf.bound.y + 0.7)) // swiper高度不会被内容撑开，需指定swiper高度
            },
            grid_click(e, shelf) {
                let grid = shelf.grids.find(g => g.index === e.detail.index)
                if (grid && grid.qty) {
                    // console.log('grid click', grid)
                    this.drawer_loc_no = grid.no
                    this.$refs.inv_drawer.open()
                }
            },
            drawer_close() {
                this.$refs.inv_drawer.close()
            }
        }
    }
</script>

<style lang="scss">
.shelf_swiper {
    .grid-item-box {
        display: flex;
        flex-direction: column;
        justify-content: space-between;        
        width: 100%;
        height: 100%;
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
            width: 100%;
            font-size: $uni-font-size-sm;
            text-align: left;
        }
        .qty {
            width: 100%;
            color: #fff;
            font-size: $uni-font-size-base;
            font-weight: bold;
            text-align: right;
        }
    }
}
</style>