<template>
    <uni-notice-bar single scrollable text="点击库存列表，可查询库存明细" />
    <uni-section title="当前仓库" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')"
        >
        <uni-list>
            <uni-list-item
                v-for="(inv_group, index) in inv_groups"
                :key="index"
                :title="inv_group.material_no"
                :note="[
                    `名称：${inv_group.material_name}`, 
                    `规格：${inv_group.material_spec}`
                ].join('\n')"
                :rightText="[inv_group.qty, inv_group.base_unit_name].join(' ')"
                @click="search_invs(inv_group.material_no)" clickable
                show-arrow
                >
            </uni-list-item>
        </uni-list>
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
    import { Inv } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                invs: [],
                inv_groups: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' },
                    ],
                    button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '库存地图',
                            backgroundColor: 'linear-gradient(90deg, #4cd964, #42b983)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.load_invs()
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.inv_map() // btn:库存地图
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        uni.navigateTo({ url: `/pages/operation/manage/inv_search?t=${res.result}`})
                    }
                })
                // #endif
            },
            search_invs(material_no) {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/manage/inv_search?t=' + material_no })
            },
            inv_map() {
                uni.navigateTo({
                    url: '/pages/operation/manage/inv_map',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInvs', { invs: this.invs })
                    }
                })
            },
            async load_invs() {
                const options = {
                    FStockId: store.state.cur_stock.FStockId
                }
                uni.showLoading({ title: 'Loading' })
                return Inv.get_all(options).then(res => {
                    uni.hideLoading()
                    this.invs = res
                    this._set_inv_groups(res)
                })
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_invs()
                this.last_refresh_time = Date.now()
            },
            _set_inv_groups(data) {
                let inv_groups = []
                data.forEach(inv => {
                    let group = inv_groups.find(x => x.material_id == inv.FMaterialId)
                    if (group) {
                        group.qty += inv.FQty
                    } else {
                        inv_groups.push({
                            material_id: inv.FMaterialId,
                            material_no: inv['FMaterialId.FNumber'],
                            material_name: inv['FMaterialId.FName'],
                            material_spec: inv['FMaterialId.FSpecification'],
                            qty: inv.FQty,
                            base_unit_name: inv['FStockUnitId.FName']
                        })
                    }
                })
                this.inv_groups = inv_groups
            }
        }
    }
</script>

<style>

</style>
