<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        class="above-uni-goods-nav"
        >
        <cc-shelf :stock_locs="$store.state.stock_locs" :open="cc_shelf_open" />
    </uni-section>
            
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, StockLoc } from '@/utils/model'
    import { breadcrumb_stockname, play_audio_prompt, link_to } from '@/utils'
    import ccShelf from '@/components/cc-shelf/cc-shelf.vue'
    export default {
        components: {
            ccShelf
        },
        data() {
            return {
                can_edit: false,
                invs: [],
                cc_shelf_open: true,
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        // { icon: 'refreshempty', text: '刷新' },
                        { icon: 'up', text: '折叠' }
                    ],
                    button_group: [
                        {
                            text: '新增库位',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this._set_goods_nav()
        },
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            StockLoc.query({ FStockId: store.state.cur_stock.FStockId, FForbidStatus: 'B' }).then(res => {
                store.commit('update_stock_locs', res.data) // 只查询禁用库存
            })
        },
        methods: {
            breadcrumb_stockname,
            goods_nav_click(e) {
                // if (e.index === 0) this.refresh()
                if (e.index === 0) this.toggle_cc_shelf()
            },
            goods_nav_button_click(e) {
                if (this.can_edit) {
                    if (e.index === 0) link_to('/pages/operation/manage/loc_new')
                }  
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                uni.showLoading({ title: 'Loading' })
                let data = await StockLoc.get_all()
                store.commit('set_stock_locs', data)
                this.last_refresh_time = Date.now()
                uni.showToast({ title: '已刷新' })
            },
            toggle_cc_shelf () {
                if (this.cc_shelf_open) {
                    this.cc_shelf_open = false
                    this.goods_nav.options[0].icon = 'down'
                    this.goods_nav.options[0].text = '展开'
                } else {
                    this.cc_shelf_open = true
                    this.goods_nav.options[0].icon = 'up'
                    this.goods_nav.options[0].text = '折叠'
                }
            },
            _set_goods_nav () {
                if (this.can_edit) {
                    this.goods_nav.button_group = [
                        {
                            text: '新增库位',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                } else {
                    this.goods_nav.button_group = [
                        {
                            text: '',
                            backgroundColor: '#fff',
                            color: '#fff'
                        }
                    ]
                }
            }
        }
    }
</script>

<style lang="scss">
  
</style>
