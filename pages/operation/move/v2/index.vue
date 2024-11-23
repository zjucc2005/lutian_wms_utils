<template>
    <view v-if="$store.state.role == 'wh_admin'">
        <uni-section title="进行中的库存调整计划" type="square" class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(inv_plan, index) in inv_plans"
                    :key="index"
                    >
                    <template v-slot:header>
                        <view class="uni-list-item__head">
                            <checkbox
                                :checked="inv_plan.checked"
                                :disabled="inv_plan.disabled"
                                @click="checkbox_click"
                                :data-id="inv_plan.FID"
                            />
                        </view>
                    </template>
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <view class="title">{{ inv_plan['FMaterialId.FNumber'] }}</view>
                            <view class="note">
                                <view>名称：{{ inv_plan['FMaterialId.FName'] }}</view> 
                                <view>规格：{{ inv_plan['FMaterialId.FSpecification'] }}</view>
                                <view>批次：{{ inv_plan.FBatchNo }}</view>
                                <view>
                                    库位：<text class="src_loc_no">{{ inv_plan['FStockLocId.FNumber'] }}</text>
                                    <template v-if="inv_plan.FOpType == 'mv'">
                                        <uni-icons type="redo" size="20" color="#007bff"></uni-icons>
                                        <text class="dest_loc_no uni-ml-2">{{ inv_plan['FDestStockLocId.FNumber'] }}</text>
                                    </template>
                                </view>
                            </view>
                            
                            <view class="note">
                                <view v-if="inv_plan.FRemark?.trim()">备注：{{ inv_plan.FRemark }}</view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <view class="op_qty">
                                <text v-if="inv_plan.FOpType == 'mv'" class="text-primary">移动 </text>
                                <text v-if="inv_plan.FOpType == 'add'" class="text-error">增加 </text>
                                <text v-if="inv_plan.FOpType == 'sub'" class="text-success">减少 </text>
                                <text>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                            </view>
                            <text :class="['status', inv_plan.disabled ? 'disabled' : '']">{{ inv_plan.status }}</text>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            
            <uni-load-more v-if="inv_plans.length === 0" status="nomore" />
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
        <uni-section title="进行中的库存调整计划" type="square" class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(inv_plan, index) in inv_plans"
                    :key="index"
                    >
                    <template v-slot:header>
                        <view class="uni-list-item__head">
                            <checkbox
                                :checked="inv_plan.checked"
                                :disabled="inv_plan.disabled"
                                @click="checkbox_click"
                                :data-id="inv_plan.FID"
                            />
                        </view>
                    </template>
                    <template v-slot:body>
                        <view class="uni-list-item__body">
                            <view class="title">{{ inv_plan['FMaterialId.FNumber'] }}</view>
                            <view class="note">
                                <view>名称：{{ inv_plan['FMaterialId.FName'] }}</view> 
                                <view>规格：{{ inv_plan['FMaterialId.FSpecification'] }}</view>
                                <view>批次：{{ inv_plan.FBatchNo }}</view>
                                <view>
                                    库位：<text class="src_loc_no">{{ inv_plan['FStockLocId.FNumber'] }}</text>
                                    <uni-icons type="redo" size="20" color="#007bff"></uni-icons> 
                                    <text class="dest_loc_no uni-ml-2">{{ inv_plan['FDestStockLocId.FNumber'] }}</text>
                                </view>
                            </view>
                            
                            <view class="note">
                                <view v-if="inv_plan.FRemark?.trim()">备注：{{ inv_plan.FRemark }}</view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <view class="op_qty">
                                <uni-icons type="redo" size="18" color="#007bff"></uni-icons>
                                <text class="op_qty">{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                            </view>
                            <text :class="['status', inv_plan.disabled ? 'disabled' : '']">{{ inv_plan.status }}</text>
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
    import { InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                inv_plans: [],
                last_refresh_time: 0,
                refresh_interval: 30 * 1000, // 30s
                goods_nav: {
                    options: [
                        { icon: 'refreshempty', text: '刷新' }
                    ],
                    admin_button_group: [
                        {
                            text: '审核确认',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        },
                        {
                            text: '新增库存调整计划',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ],
                    staff_button_group: [
                        {
                            text: '提交',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.load_inv_plans()
        },
        onPullDownRefresh() {
            this.refresh()
            uni.stopPullDownRefresh()
        },
        mounted() {
            // this.load_inv_plans()
        },
        methods: {
            // check_all() {
            //     let checked_all = !this.inv_plans.find(inv_plan => !inv_plan.disabled && !inv_plan.checked)
            //     this.inv_plans.forEach(inv_plan => {
            //         if (!inv_plan.disabled) inv_plan.checked = !checked_all
            //     })
            // },
            checkbox_click(e) {
                let inv_plan = this.inv_plans.find(x => x.FID == e.target.dataset.id)
                if (inv_plan && !inv_plan.disabled) {
                    inv_plan.checked = !inv_plan.checked
                }  
            },
            goods_nav_click(e) {
                if (e.index === 0) this.refresh() // btn:刷新
            },
            goods_nav_admin_button_click(e) {
                if (e.index === 0) this.submit_audit() // btn:审核确认
                if (e.index === 1) this.new_plan() // btn:新增库存调整计划
            },
            goods_nav_staff_button_click(e) {
                if (e.index === 0) this.submit_submit() // btn:提交
            },        
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId, FOpType_in: ['mv', 'add', 'sub'] }
                if (store.state.role == 'wh_admin') {
                    options.FDocumentStatu_in = ['A', 'B']
                } else {
                    options.FDocumentStatu = 'A'
                }
                uni.showLoading({ title: 'Loading' })
                return InvPlan.query(options, { order: 'FCreateTime ASC' }).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        inv_plan.checked = false
                        if (store.state.role == 'wh_admin') {
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                        if (store.state.role == 'wh_staff') {
                            inv_plan.disabled = inv_plan.FDocumentStatu != 'A'
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
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
            async submit_audit() {
                let checked_inv_plans = this.inv_plans.filter(x => x.checked)
                if (checked_inv_plans.length === 0) {
                    uni.showToast({ icon: 'none', title: '未选择任何条目' })
                    return
                }
                uni.showLoading({ title: 'Loading' })
                let save_ids = checked_inv_plans.filter(x => x.FDocumentStatu == 'A').map(x => x.FID)
                if (save_ids.length) {
                    await InvPlan.submit(save_ids) // 提交(admin补)
                }
                let ids = checked_inv_plans.map(x => x.FID)
                let response = await InvPlan.audit(ids)
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    for (let i = 0; i < checked_inv_plans.length; i++) {
                        await InvPlan.execute(checked_inv_plans[i]) // 审核确认
                    }
                    await this.load_inv_plans()
                    uni.hideLoading()
                    play_audio_prompt('success')
                } else {
                    uni.hideLoading()
                    uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            async submit_submit() {
                let checked_inv_plans = this.inv_plans.filter(x => x.checked)
                if (checked_inv_plans.length === 0) {
                    uni.showToast({ icon: 'none', title: '未选择任何条目' })
                    return
                }
                uni.showLoading({ title: 'Loading' })
                let ids = checked_inv_plans.map(x => x.FID)
                InvPlan.submit(ids).then(res => {
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        uni.hideLoading()
                        play_audio_prompt('success')
                        this.load_inv_plans()
                    } else {
                        uni.hideLoading()
                        uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                })
            },
            new_plan() {
                play_audio_prompt('success')
                uni.navigateTo({ 
                    url: '/pages/operation/move/v2/plan_new'
                })
            }
        }
    }
</script>

<style>

</style>
