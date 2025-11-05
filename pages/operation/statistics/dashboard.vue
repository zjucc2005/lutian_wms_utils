<template>
    <view class="bg">
        <uni-row :gutter="10">
            <!-- <uni-col :span="21" class="scroll-list1" :style="{ animationDuration: 120 / scroll_speed + 's' }">
                <uni-table>
                    <template v-for="dup in 2" :key="dup">
                        <template v-for="(shelf, si) in table_shelves" :key="si">
                            <uni-tr v-for="(row, i) in shelf.grids" :key="i">
                                <uni-td v-if="i === 0" :rowspan="shelf.grids.length" class="cc-shelf-name" align="center" width="60">
                                    {{ shelf.name.split('-')[1] }}
                                </uni-td>
                                <uni-td v-for="(grid, j) in shelf.grids[shelf.grids.length-i-1]" :key="j" :class="['cc-shelf-grid', grid?.style || 'none']" align="center" width="20">
                                    <view v-if="grid">
                                        {{ grid.name }}
                                    </view>
                                    <view v-else>ᅠ</view>
                                </uni-td>
                            </uni-tr>
                        </template>
                    </template>
                </uni-table>
            </uni-col> -->
            <uni-col v-if="table_shelves.length" :span="21" class="scroll-list" :style="{ animationDuration: 120 / scroll_speed + 's' }">
                <template v-for="dup in 2" :key="dup">
                    <uni-card v-for="(shelf, si) in table_shelves" :key="si" margin="5px" padding="10px 0">
                        <view class="shelf-name">{{ shelf.name }}</view>
                        <view v-for="seq in Math.ceil((shelf.grids[0]?.length || 0)/grid_span)" :key="seq" class="shelf-grids">
                            <view class="shelf-grids-row" v-for="i in shelf.grids.length" :key="i">
                                <view v-for="j in grid_span"
                                    :class="['shelf-grid', shelf.grids[shelf.grids.length-i][(seq-1)*grid_span+j-1]?.style || 'none']"
                                    :style="{ height: ($store.state.system_info.windowWidth * 0.875-32) / grid_span - 2 + 'px' }"
                                    >
                                    {{ shelf.grids[shelf.grids.length-i][(seq-1)*grid_span+j-1]?.name }}
                                </view>
                            </view>
                        </view>
                    </uni-card>
                </template>
            </uni-col>
            
            <uni-col :span="3">
                <uni-row>
                    <uni-card margin="10px" spacing="0" padding="5px"  @click="debug">
                        <view class="stock-name">
                            {{ $store.state.cur_stock['FName'] }}
                        </view>
                    </uni-card>
                </uni-row>
                <uni-row>
                    <uni-card margin="10px" spacing="0" padding="0">
                        <view class="title">滚动速度</view>
                        <slider :value="scroll_speed" step="1" :min="1" :max="4"
                            active-color="#007aff" block-color="#007aff" block-size="20"
                            @change="slider_change" />
                    </uni-card>
                </uni-row>
                <uni-row>
                    <uni-card margin="10px" spacing="0" padding="0">
                        <view class="title">库存总数</view>
                        <view class="striking-number">
                            {{ sum_inv_qty }}
                        </view>
                    </uni-card>
                </uni-row>
                <uni-row>
                    <uni-card margin="10px" spacing="0" padding="0 10px">
                        <view class="cc-shelf-grid-sample">
                            <view class="cc-shelf-grid-sample-item success"></view>
                            <view>库位已使用</view>
                        </view>
                        <view class="cc-shelf-grid-sample">
                            <view class="cc-shelf-grid-sample-item default"></view>
                            <view>库位未使用</view>
                        </view>
                        <view class="cc-shelf-grid-sample">
                            <view class="cc-shelf-grid-sample-item error"></view>
                            <view>库位被禁用</view>
                        </view>
                        <qiun-data-charts type="ring" :opts="chart_opts" :chart-data="chart_data" />
                    </uni-card>
                </uni-row>
            </uni-col>
        </uni-row>
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, StockLoc } from '@/utils/model'
    import { CcShelf, CcGrid } from '@/utils/model/cc_shelf'
    
    export default {
        data() {
            return {
                grid_span: 35,
                table_shelves: [
                    { shelf: 'A01', grids: [] }
                ],
                sum_inv_qty: 0,
                loc_qty: { total: 0, disabled: 0, used: 0, idle: 0 }, // 库位数统计
                stock_locs_used: {}, // 记录库位是否被占用，刷新库存时，先对比此数据，再更新table_shelves，减少渲染请求
                timer: null,
                scroll_speed: 1
            }
        },
        onUnload() {
            if (this.timer) {
                clearInterval(this.timer) // 清除计时器
            }
        },
        mounted() {
            this.init_table_shelves()
            this.load_invs()
            this.timer = setInterval(() => {
                this.load_invs()
            }, 30000) // 设定计时器，定时刷新
        },
        computed: {
            chart_opts() {
                return {
                    rotate: false,
                    rotateLock: false,
                    color: ["#67C23A","#C0C0C0","#F56C6C",],
                    padding: [0,0,0,0],
                    dataLabel: false,
                    enableScroll: false,
                    legend: {
                        show: false,
                        position: "top",
                        lineHeight: 20
                    },
                    title: {
                        name: "库位使用率",
                        fontSize: 16,
                        color: "#333333"
                    },
                    subtitle: {
                        name: (this.loc_qty.used * 100 / this.loc_qty.total).toFixed(1) + '%',
                        fontSize: 30,
                        color: "#007aff"
                    },
                    extra: {
                        ring: {
                            ringWidth: 15,
                            activeOpacity: 0,
                            activeRadius: 10,
                            offsetAngle: 0,
                            labelWidth: 10,
                            border: false,
                        }
                    }
                }
            },
            chart_data () {
                return { series: [{
                    data: [
                        { name: "已使用", value: this.loc_qty.used },
                        { name: "未使用", value: this.loc_qty.idle },
                        { name: "被禁用", value: this.loc_qty.disabled }
                    ]
                }]}
            }
        },
        methods: {
            // 初始化表格库位形式table_shelves
            init_table_shelves() {
                // 1. group by shelf_no prefix, format
                // 2. init cell < row < table && sort
                let shelves = []
                this.loc_qty.total = store.state.stock_locs.length
                for (let stock_loc of store.state.stock_locs) {
                    let grid = new CcGrid(stock_loc)
                    if (stock_loc.FForbidStatus == 'B') {
                        this.loc_qty.disabled += 1
                    }
                    let shelf = shelves.find(s => s.name == grid.shelf)
                    if (shelf) {
                        shelf.add_grid(grid)
                    } else {
                        shelf = new CcShelf(grid)
                        shelves.push(shelf)
                    }
                }
                shelves.sort((x, y) => x.name >= y.name ? 1 : -1)
                this.table_shelves = shelves
            },
            // 加载库存数据
            load_invs(){
                // console.log('load_invs')
                Inv.get_all({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    this.update_data(res)
                })
            },
            // 更新数据逻辑
            update_data(invs) {
                let sum_inv_qty = 0
                for (let inv of invs) {
                    sum_inv_qty += inv['FQty']
                    if (!this.stock_locs_used[inv['FStockLocId.FNumber']]) {
                        this.grid_activate(inv['FStockLocId.FGroup'], inv['FStockLocId.FPosX'], inv['FStockLocId.FPosY'])
                    }
                    this.stock_locs_used[inv['FStockLocId.FNumber']] = { v: 2, group: inv['FStockLocId.FGroup'], x: inv['FStockLocId.FPosX'], y: inv['FStockLocId.FPosY'] }
                }
                this.sum_inv_qty = sum_inv_qty
                this.loc_qty.used = 0
                for (let k of Object.keys(this.stock_locs_used)) {
                    if (this.stock_locs_used[k].v === 1) {
                        this.grid_deactivate(this.stock_locs_used[k].group, this.stock_locs_used[k].x, this.stock_locs_used[k].y)
                        this.stock_locs_used[k].v = 0
                    } else if (this.stock_locs_used[k].v === 2) {
                        this.stock_locs_used[k].v = 1
                        this.loc_qty.used += 1
                    }
                }
                this.loc_qty.idle = this.loc_qty.total - this.loc_qty.used - this.loc_qty.disabled
            },
            grid_activate (group, x, y) {
                let shelf = this.table_shelves.find(s => s.name == group)
                shelf.grids[y-1][x-1].used = true
                if (shelf.grids[y-1][x-1].style != 'error') {
                    shelf.grids[y-1][x-1].style = 'success'
                }
            },
            grid_deactivate (group, x, y) {
                let shelf = this.table_shelves.find(s => s.name == group)
                shelf.grids[y-1][x-1].used = false
                if (shelf.grids[y-1][x-1].style != 'error') {
                    shelf.grids[y-1][x-1].style = 'default'
                }
            },
            slider_change(e) {
                this.scroll_speed = e.detail.value
            },
            debug() {
                console.log('data', this.$data)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .bg::v-deep{
        width: 100%;
        height: 100vh;
        overflow: hidden;
        background-color: #1D2B56;
        background: url('@/static/image/dashboard-bg.jpg') no-repeat;
        background-size: cover;
        .uni-table {
            background: none !important;
        }
        .uni-table-tr:hover {
            background: none !important;
        }
        .uni-table-th, .uni-table-td {
            color: #fff;
            padding: 2px 1px;
            // white-space: nowrap;
        }
        .uni-card {
            background: rgba(21,45,103,.4);
            border-color: rgba(103,144,255,.2);
            .title {
                color: #fff;
                font-size: 16px;
                margin: 5px 10px;
            }
        }        
    }
    .cc-shelf-name {
        border: 1px #EBEEF580 solid;
        padding: 8px;
        font-size: 24px;
    }
    .cc-shelf-grid {
        border: 1px #EBEEF580 solid;
        font-size: 12px;
        &.success {
            background-color: #67c23a;
        }
        &.error {
            background-color: #f56c6c;
        }
        &.none {
            border: none;
        }
    }
    .cc-shelf-grid-sample {
        margin: 10px auto;
        display: flex;
        justify-content: space-between;
        color: #fff;
        font-size: 16px;
        
        .cc-shelf-grid-sample-item {
            width: 24px;
            height: 24px;
            // border: 1px #EBEEF5 solid;
            &.default {
                background-color: #c0c0c0;
            }
            &.success {
                background-color: #67c23a;
            }
            &.error {
                background-color: #f56c6c;
            }
        }
    }
    .stock-name {
        min-height: 42px;
        color: #fff;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: space-around;
    }
    .striking-number {
        height: 72px;
        color: #fff32b;
        font-size: 36px;
        display: flex;
        align-items: center;
        justify-content: space-around;
    }
    
    // grid shelf style
    .shelf-name {
        font-size: 28px;
        font-weight: bold;
        color: #FFFFFF;
        // margin-bottom: 10px;
    }
    .shelf-grids {
        margin-top: 10px;
    }
    .shelf-grids-row {
        display: flex;
    }
    .shelf-grid {
        flex: 1;
        border: 1px solid #091332;
        border-radius: 2px;
        // height: 44px;
        color: #FFFFFF;
        padding-left: 3px;
        &.default {
            background-color: $uni-text-color-disable;
        }
        &.success {
            background-color: #67c23a;
        }
        &.error {
            background-color: #f56c6c;
        }
        &.none {
            background-color: transparent;
            color: transparent;
            border-color: transparent;
        }
    }
</style>
