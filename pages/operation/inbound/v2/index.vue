<template>
    <!-- <uni-notice-bar single show-icon scrollable text="请选择入库计划进行操作" /> -->
    <view v-if="$store.state.role == 'wh_admin'">
        <uni-section title="进行中的入库计划" type="square" 
            sub-title="单据编号"
            class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(group_item, index) in inv_plan_groups"
                    :key="index"
                    :right-text="group_item.created_at"
                    show-arrow
                    @click="operate_plan(group_item.bill_no)" clickable
                    >
  <!--                  <template v-slot:header>
                        <view class="uni-list-item__head">
                            <checkbox
                                :checked="group_item.checked"
                                :disabled="group_item.disabled"
                                @click="checkbox_click"
                                :data-bill_no="group_item.bill_no"
                            />
                        </view>
                    </template> -->
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
            
            <uni-load-more v-if="inv_plan_groups.length === 0" status="nomore" />
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.admin_button_group"
                :fill="$store.state.goods_nav_fill"
                @click="goods_nav_click"
                @button-click="goods_nav_admin_button_click"
            />
        </view>
    </view>
    
    <view v-if="$store.state.role == 'wh_staff'">
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
                :fill="$store.state.goods_nav_fill"
                @click="goods_nav_click"
                @button-click="goods_nav_staff_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    import { InboundTask, InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import scan_code from '@/utils/scan_code'
    export default {
        data() {
            return {
                inbound_task: '',
                inv_plans: [],
                inv_plan_groups: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' }
                    ],
                    admin_button_group: [
                        // {
                        //     text: '审核确认',
                        //     backgroundColor: store.state.goods_nav_color.red,
                        //     color: '#fff'
                        // },
                        {
                            text: '新增入库计划',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ],
                    staff_button_group: [
                        {
                            text: '扫码查询',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.load_inv_plans()
            this.inbound_task = InboundTask.current()
            if (this.inbound_task) {
                this.goods_nav.admin_button_group[0].text = '编辑入库计划'
                this.goods_nav.admin_button_group[0].backgroundColor = store.state.goods_nav_color.green
            } else {
                this.goods_nav.admin_button_group[0].text = '新增入库计划'
                this.goods_nav.admin_button_group[0].backgroundColor = store.state.goods_nav_color.blue
            }
        },
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        methods: {
            // checkbox_click(e) {
            //     let group_item = this.inv_plan_groups.find(x => x.bill_no == e.target.dataset.bill_no)
            //     if (group_item) {
            //         group_item.checked = !group_item.checked
            //     }
            // },
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
            },
            goods_nav_admin_button_click(e) {
                // if (e.index === 0) this.submit_audit() // btn:审核确认
                if (e.index === 0) this.init_plan() // btn:初始化入库计划
            },
            goods_nav_staff_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
            },
            scan_code() {
                scan_code().then(res => {
                    this.operate_plan(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },          
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId, FOpType: 'in' }
                if (store.state.role == 'wh_admin') {       
                    options.FDocumentStatu_in = ['A', 'B']
                } else {
                    options.FDocumentStatu = 'A'
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
            // async submit_audit() {
            //     let checked_groups = this.inv_plan_groups.filter(x => x.checked)
            //     if (checked_groups.length === 0) {
            //         uni.showToast({ icon: 'none', title: '未选择任何条目' })
            //         return
            //     }
            //     for (let i = 0; i < checked_groups.length; i++) {
            //         let checked_inv_plans = this.inv_plans.filter(x => x.FBillNo == checked_groups[i].bill_no)
            //         uni.showLoading({ title: 'Loading' })
            //         let save_ids = checked_inv_plans.filter(x => x.FDocumentStatu == 'A').map(x => x.FID)
            //         if (save_ids.length) {
            //             await InvPlan.submit(save_ids) // 提交(admin补)
            //         }
            //         let ids = checked_inv_plans.map(x => x.FID)
            //         let response = await InvPlan.audit(ids) // 审核确认
            //         if (response.data.Result.ResponseStatus.IsSuccess) {
            //             for (let j = 0; j < checked_inv_plans.length; j++) {
            //                 await InvPlan.execute(checked_inv_plans[j])
            //             }
            //             await this.load_inv_plans()
            //             uni.hideLoading()
            //         } else {
            //             uni.hideLoading()
            //             uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
            //         }
            //     }
            // },
            // 如果有当前入库任务，则继续入库任务
            init_plan() {
                if (this.inbound_task) {
                    if (this.inbound_task.category == 'bill') {
                        play_audio_prompt('success')
                        uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init' })
                    } else if (this.inbound_task.category == 'pallet') {
                        play_audio_prompt('success')
                        uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init_pallet' })
                    } else if (this.inbound_task.category == 'custom') {
                        play_audio_prompt('success')
                        uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init_custom' })
                    }
                } else {
                    uni.showActionSheet({
                        itemList: ['扫《直接调拨单》', '扫《物料标识卡》', '手工录入'],
                        success: (e) => {
                            if (e.tapIndex === 0) {
                                play_audio_prompt('success')
                                uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init' })
                            } else if (e.tapIndex === 1) {
                                play_audio_prompt('success')
                                uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init_pallet' })
                            } else if (e.tapIndex === 2) {
                                play_audio_prompt('success')
                                uni.navigateTo({ url: '/pages/operation/inbound/v2/plan_init_custom' })
                            }
                        }
                    })
                }
            },
            operate_plan(bill_no) {
                if (!this.inv_plan_groups.find(x => x.bill_no == bill_no)) {
                    uni.showToast({ icon: 'none', title: '未找到单据编号' })
                    return
                }
                play_audio_prompt('success')
                uni.navigateTo({ url: `/pages/operation/inbound/v2/plan_show?t=${bill_no}` })
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
