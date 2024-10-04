<template>
    <view>
        <uni-section title="当前仓库" type="square"
            :sub-title="[
                $store.state.cur_stock['FUseOrgId.FName'],
                $store.state.cur_stock['FGroup.FName'],
                $store.state.cur_stock.FName
            ].join(' / ')"
            class="above-uni-goods-nav"
            >
            <uni-collapse>
                <uni-collapse-item
                    v-for="shelf in grid_shelves"
                    :title="shelf.name" :open="true" title-border="show"
                    >
                    <view class="content">
                        <swiper :indicator-dots="true" :style="{ height: `${get_swiper_height(shelf)}px` }" class="shelf_swiper">
                            <swiper-item v-for="page in get_swiper_pages(shelf)" :key="page">
                                <uni-grid :column="10" :show-border="false" @change="change">
                                    <uni-grid-item
                                        v-for="grid in filter_swiper_grids(shelf, page)"
                                        :key="grid.index"
                                        :index="grid.index"
                                        >
                                        <view :class="['grid-item-box', grid.style]">
                                            <view class="name">{{ grid.name }}</view>
                                            <view class="qty">{{ grid.qty }}</view>
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
                stock_locs: [],
                grid_shelves: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                status_dict: { A: '已新增', B: '已提交', C: '已审核' },
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' }
                    ],
                    button_group: [
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
                this.grid_shelves = parse_stock_locs(store.state.stock_locs)
            })
        },
        methods: {
            filter_swiper_grids,
            get_swiper_pages,
            get_swiper_height,
            // >>> component
            goods_nav_click(e) {
                if (e.index == 0) this.refresh()
            },
            goods_nav_button_click(e) {
                if (e.index == 0) uni.navigateTo({ url: '/pages/operation/manage/loc_new' })
            },
            refresh() {
                console.log('data', this.$data)
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                uni.showLoading({ title: 'Loading' })               
                StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    this.grid_shelves = parse_stock_locs(res.data)
                    store.commit('set_stock_locs', res.data)
                    this.last_refresh_time = Date.now()
                    uni.showToast({ title: '已刷新' })
                })
            },
            change(e) {
                console.log('change e:', e)
            }
        }
    }
</script>

<style lang="scss">
  
</style>
