<template>
    <view>
        <uni-section
            title="库位列表"
            :sub-title="`${cur_stock['FGroup.FName']} - ${cur_stock.FName}`"
            type="line"
            style="padding-bottom: 60px;"
        >   
            <uni-swipe-action v-if="false" ref="stock_loc_swipe">
                <uni-swipe-action-item
                    v-for="(stock_loc, index) in stock_locs"
                    :key="index"
                    :threshold="60"
                    :right-options="swipe_action_options"
                    @click="swipe_action_click($event, index)"
                >
                    <uni-list-item :title="stock_loc.FNumber" :rightText="this.status_dict[stock_loc.FDocumentStatus]" />
                </uni-swipe-action-item>
            </uni-swipe-action>
                       
            <uni-collapse @change="change">
                <uni-collapse-item v-for="shelf in grid_shelves" :title="shelf.name" :open="true" title-border="show">
                    <view class="content">
                        <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                            <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                                <uni-grid :column="10">
                                    <uni-grid-item
                                        v-for="grid in filter_swiper_grids(shelf, page)"
                                        :key="grid.index"
                                        :index="grid.index"
                                    >
                                        <view :class="['grid-item-box', grid.style]">
                                            <view class="name">{{ grid.name }}</view>
                                            <view class="qty">{{  }}</view>
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
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { StockLoc } from '@/utils/model'
    import { is_loc_no_std_format, parse_stock_locs, filter_swiper_grids, get_swiper_pages, get_swiper_height } from '@/utils'
    export default {
        data() {
            return {
                system_info: {},
                cur_stock: {},
                stock_locs: [],
                grid_shelves: [],
                status_dict: { A: '已新增', B: '已提交', C: '已审核' },
                swipe_action_options: [
                    // {
                    //     text: '删除',
                    //     style: {
                    //         backgroundColor: '#f56c6c'
                    //     }
                    // }
                ],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        {
                            text: '全部展开/关闭',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '新增库位',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.$nextTick(_ => {
                this.system_info = store.state.system_info
                this.cur_stock = store.state.cur_stock
            })
        },          
        onShow() {
            this.load_stock_locs()           
        },
        methods: {
            filter_swiper_grids,
            get_swiper_pages,
            get_swiper_height,
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) {
                    // 排序
                    uni.showActionSheet({
                        itemList: ['按库位号排序', '按创建时间排序'],
                        success: (e) => {
                            console.log('showActionSheet e:', e)
                            if (e.tapIndex === 0) {}
                            if (e.tapIndex === 1) {}
                        }
                    })
                }                         
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.switch_display()
                if (e.index === 1) uni.navigateTo({ url: '/pages/operation/manage/loc_new' })
            },
            // action
            load_stock_locs() {
                StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    this.stock_locs = res.data
                    this.grid_shelves = parse_stock_locs(res.data)
                })
            },
            // set_swiper_grid_count(shelf) {
            //     return shelf.bound.y * 10 // 获取swiper页面grid总数
            // },
            // set_grid_coordinate(shelf, page, grid_index) {
            //     // 设置 grid 坐标
            //     // let set = [index % 10, shelf.bound.y - Math.floor(grid_index / 10)].join(',')
            //     let x = grid_index % 10
            //     x = x == 0 ? 10 : x
            //     x += (page - 1) * 10
            //     let y = shelf.bound.y - Math.floor(grid_index / 10)
            //     return [x, y].join(',')
            // },
            swipe_action_click(e, list_index) {
                console.log('swipe action click e:', e, list_index) 
                if (e.index === 0) {
                    let stock_loc = this.stock_locs[list_index]
                    // console.log("delete stock_loc:", stock_loc)
                    StockLoc.delete([stock_loc.FID]).then(res => {
                        if (res.statusCode === 200 && res.data.Result.ResponseStatus.IsSuccess) {
                            this.stock_locs.splice(list_index, 1) // 删除行                           
                        } else {
                            uni.showToast({
                                icon: 'error',
                                title: res.data.Result.ResponseStatus.Errors[0].Message
                            })
                        }
                    }).catch(err => {
                        console.log('err:', err)
                        uni.showToast({
                            icon: 'error',
                            title: '不能删除'
                        })
                    }) 
                    this.$refs.stock_loc_swipe.closeAll() // 复位滑动操作
                }              
            },
            switch_display() {
                console.log('data', this.$data)
            },
            change(e) {
                console.log('change e:', e)
            }
        }
    }
</script>

<style lang="scss">
  
</style>
