<template>
    <view>
        <uni-section title="进行中的计划" type="square" class="above-uni-goods-nav">
            
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                inv_plans: [],
                inv_plan_groups: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' }
                    ],
                    button_group: [
                        {
                            text: '新增入库计划（扫码）',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新增入库计划',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ],
                    options_2: [
                        { icon: 'bars', text: '详情' }
                    ],
                    button_group_2: [
                        {
                            text: '结束入库任务',
                            backgroundColor: 'linear-gradient(90deg, #AAA, #606266)',
                            color: '#fff'
                        },
                        {
                            text: '继续入库任务',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.load_inv_plans() 
        },
        methods: {
            // >>> binding
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.refresh() // btn:刷新
                    console.log('this', this)
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) {
                    play_audio_prompt('success')
                    uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_new' }) // btn:新建入库计划
                }
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_inv_plans()
                this.last_refresh_time = Date.now()
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') uni.navigateTo({ url: `/pages/operation/inbound/v2/plan_new?t=${res.result}`})
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        uni.navigateTo({ url: `/pages/operation/inbound/v2/plan_new?t=${res.result}`})
                    }
                })
                // #endif
            },          
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId }
                if (store.state.role == 'admin') {       
                    options.FDocumentStatus_in = ['A', 'B']
                } else {
                    options.FDocumentStatus = 'A'
                }
                uni.showLoading({ title: 'Loading' })
                InvPlan.query(options, {}).then(res => {
                    this.inv_plans = res.data
                    this._set_inv_plan_groups(res.data)
                    uni.hideLoading()
                })
            },
            _set_inv_plan_groups(inv_plans) {
                this.inv_plan_groups = inv_plans
            }
        }
    }
</script>

<style>

</style>
