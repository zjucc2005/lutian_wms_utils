<template>
    <uni-notice-bar single scrollable text="库位网格可左右滑动" />
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        class="above-uni-goods-nav"
        >
        <cc-shelf 
            :stock_locs="$store.state.stock_locs"
            :invs="invs"
            :column="10"
            :open="cc_shelf_open"/>
    </uni-section>
            
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
</template>

<script>
    import store from '@/store'
    import { Inv, StockLoc } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import ccShelf from '@/components/cc-shelf/cc-shelf.vue'
    export default {
        components: {
            ccShelf
        },
        data() {
            return {
                invs: [],
                cc_shelf_open: true,
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                        { icon: 'up', text: '折叠' }
                    ],
                    button_group: [
                        {
                            text: '库存地图',
                            backgroundColor: 'linear-gradient(90deg, #4cd964, #42b983)',
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
        },
        methods: {
            // >>> component
            goods_nav_click(e) {
                if (e.index === 0) this.refresh()
                if (e.index === 1) this.toggle_cc_shelf()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.if_inv_map()
                if (e.index === 1) this.new_loc_no()
            },
            if_inv_map() {
                uni.showModal({
                    title: '注意事项',
                    content: '库存地图需要加载所有库存数据，当数据量较大时，可能会需要较长时间。确定要加载吗？',
                    success: (res) => {
                        if (res.confirm) this.load_invs()
                    },
                    fail: (err) => {}
                })
            },
            new_loc_no () {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/manage/loc_new' })
            },
            async load_invs() {
                const options = {
                    FStockId: store.state.cur_stock.FStockId
                }
                uni.showLoading({ title: 'Loading' })
                return Inv.get_all(options).then(res => {
                    uni.hideLoading()
                    play_audio_prompt('success')
                    this.invs = res
                })
            },
            async refresh() {
                console.log('data', this.$data)
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                uni.showLoading({ title: 'Loading' })               
                return StockLoc.query({ FStockId: store.state.cur_stock.FStockId }).then(res => {
                    store.commit('set_stock_locs', res.data)
                    this.last_refresh_time = Date.now()
                    uni.showToast({ title: '已刷新' })
                })
            },
            toggle_cc_shelf () {
                if (this.cc_shelf_open) {
                    this.cc_shelf_open = false
                    this.goods_nav.options[1].icon = 'down'
                    this.goods_nav.options[1].text = '展开'
                } else {
                    this.cc_shelf_open = true
                    this.goods_nav.options[1].icon = 'up'
                    this.goods_nav.options[1].text = '折叠'
                }
            }
        }
    }
</script>

<style lang="scss">
  
</style>
