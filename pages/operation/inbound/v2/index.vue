<template>
    <!-- <uni-notice-bar single show-icon scrollable text="请选择入库计划进行操作" /> -->
    <view v-if="$store.state.role == 'admin'">
        <uni-section title="进行中的入库计划" type="square" class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(group_item, index) in inv_plan_groups"
                    :key="index"
                    :right-text="group_item.created_at"
                    show-arrow
                    @click="operate_plan(group_item.bill_no)" clickable
                    >
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <text class="title">{{ group_item.bill_no }}</text>
                            <view class="note">
                                <progress
                                    :percent="group_item.qty_b * 100 / (group_item.qty_b + group_item.qty_a)" 
                                    stroke-width="2"
                                    :active-color="group_item.qty_b / (group_item.qty_b + group_item.qty_a) == 1 ? '#4cd964' : '#f0ad4e'"
                                    :active="true"
                                />
                                <text class="qty">已上架： {{ group_item.qty_b }} / {{ group_item.qty_a + group_item.qty_b }}</text>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.admin_button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_admin_button_click"
            />
        </view>
    </view>
    
    <view v-if="$store.state.role == 'staff'">
        <uni-section title="进行中的入库计划" type="square" class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(group_item, index) in inv_plan_groups"
                    :key="index"
                    :right-text="group_item.created_at"
                    show-arrow
                    @click="operate_plan(group_item.bill_no)" clickable
                    >                    
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <text class="title">{{ group_item.bill_no }}</text>
                            <view class="note">
                                <text>剩余：{{ group_item.qty_a }}</text>
                            </view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.staff_button_group"
                @click="goods_nav_click"
                @button-click="goods_nav_staff_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
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
                    admin_button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '新增入库计划',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ],
                    staff_button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
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
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
            },
            goods_nav_admin_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.new_plan() // btn:新增入库计划
            },
            goods_nav_staff_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    if (res.success == 'true') this.operate_plan(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        this.operate_plan(res.result)
                    }
                })
                // #endif
            },          
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId, FOpType: 'in' }
                if (store.state.role == 'admin') {       
                    options.FDocumentStatus_in = ['A', 'B']
                } else {
                    options.FDocumentStatus = 'A'
                }
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query(options, { order: 'FCreateTime ASC' }).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this._set_inv_plan_groups(res.data)
                })
            },
            async refresh() {
                if (this.last_refresh_time + this.refresh_interval > Date.now()) {
                    uni.showToast({ icon: 'none', title: '请不要频繁刷新' })
                    return
                }
                await this.load_inv_plans()
                this.last_refresh_time = Date.now()
            },
            new_plan() {
                play_audio_prompt('success')
                uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_new' })
            },
            operate_plan(bill_no) {
                if (!this.inv_plan_groups.find(x => x.bill_no == bill_no)) {
                    uni.showToast({ icon: 'none', title: '未找到单据编号' })
                    return
                }
                uni.navigateTo({
                    url: `/pages/operation/inbound/v2/plan_show?t=${bill_no}`,
                    events: {
                        reloadInvPlans: (data) => {
                            if (data.reload) {
                                console.log('重载数据')
                                this.load_inv_plans()
                            }
                        }
                    },
                    success: (res) => {
                        
                    }
                })
            },
            _set_inv_plan_groups(inv_plans) {
                let inv_plan_groups = []
                inv_plans.forEach(inv_plan => {
                    let group_item = inv_plan_groups.find(x => x.bill_no == inv_plan.FBillNo)
                    if (group_item) {
                        if (inv_plan.FDocumentStatu == 'A') group_item.qty_a += inv_plan.FOpQTY
                        if (inv_plan.FDocumentStatu == 'B') group_item.qty_b += inv_plan.FOpQTY
                    } else {
                        group_item = {
                            bill_no: inv_plan.FBillNo,
                            created_at: formatDate(inv_plan.FCreateTime, 'yyyy-MM-dd'),
                            qty_a: inv_plan.FDocumentStatu == 'A' ? inv_plan.FOpQTY : 0,
                            qty_b: inv_plan.FDocumentStatu == 'B' ? inv_plan.FOpQTY : 0
                        }
                        inv_plan_groups.push(group_item)
                    }
                })
                this.inv_plan_groups = inv_plan_groups
            }
        }
    }
</script>

<style lang="scss">

</style>
