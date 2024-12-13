<template>
    <uni-notice-bar
        v-if="_forbid_loc_nos().length"
        :text="`${ _forbid_loc_nos().length } 个库位报警 ${_forbid_loc_nos().join(', ')}，请尽快处理。`"
        color="#f55858"
        background-color="#f5dcdc"
        show-icon single scrollable
    />
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
            :open="cc_shelf_open"
            forbidable
            />
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
            goods_nav_click(e) {
                if (e.index === 0) this.refresh()
                if (e.index === 1) this.toggle_cc_shelf()
            },
            goods_nav_button_click(e) {
                if (store.state.role == 'wh_admin') {
                    if (e.index === 0) this.new_loc_no()
                }  
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
            },
            _forbid_loc_nos () {
                return store.state.stock_locs.filter(x => x.FForbidStatus == 'B').map(x => x.FNumber)
            },
            _set_goods_nav () {
                if (store.state.role == 'wh_admin') {
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
