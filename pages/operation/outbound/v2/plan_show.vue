<template>
    <view v-if="$store.state.role == 'wh_admin'">
        <uni-section title="出库计划" type="square"
            :sub-title="[bill_no, inv_plans[0]?.FReceiver].join(' / ')"
            class="above-uni-goods-nav">
            <uni-list>
                <uni-list-item
                    v-for="(inv_plan, index) in inv_plans"
                    :key="index"
                    @click="list_item_click(inv_plan)" clickable
                    show-arrow
                    @longpress="list_item_click(inv_plan)"
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
                                <view>
                                    库位：<text class="loc_no">{{ inv_plan['FStockLocId.FNumber'] }}</text>
                                </view>
                                <view>批次：{{ inv_plan['FBatchNo'] }}</view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <view class="op_qty">
                                <uni-icons type="arrow-down" size="18" color="#4cd964"></uni-icons>
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
                :button-group="goods_nav.admin_button_group"
                :fill="$store.state.goods_nav_fill"
                @click="goods_nav_click"
                @button-click="goods_nav_admin_button_click"
            />
        </view>
    </view>
    
    <view v-if="$store.state.role == 'wh_staff'">
        <uni-section type="square" title="出库计划"
            :sub-title="bill_no"
            class="above-uni-goods-nav">
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
                                <view>库位：
                                    <uni-icons type="location" color="#007bff" ></uni-icons>
                                    <text class="loc_no">{{ inv_plan['FStockLocId.FNumber'] }}</text>
                                </view>
                                <view>批次：{{ inv_plan['FBatchNo'] }}</view>
                            </view>
                        </view>
                    </template>
                    <template v-slot:footer>
                        <view class="uni-list-item__foot">
                            <text>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
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
    import K3CloudApi from '@/utils/k3cloudapi'
    import { InvPlan } from '@/utils/model'
    import { play_audio_prompt } from '@/utils'
    // #ifdef H5
    import { pdf_template_inv_plans_out } from '@/gen_pdf'
    // #endif
    export default {
        props: {
            t: {
                type: String
            }
        },
        data() {
            return {
                bill_no: '',
                inv_plans: [],
                goods_nav: {
                    options: [
                        { icon: 'checkbox', text: '全选' }
                    ],
                    admin_button_group: [
                        {
                            text: '审核确认',
                            backgroundColor: store.state.goods_nav_color.green,
                            color: '#fff'
                        },
                        // #ifdef H5
                        {
                            text: '预览PDF',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                        // #endif
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
        onLoad(options) {
            if (options.t) {
                this.bill_no = options.t
                this.load_inv_plans()
            }
        },
        mounted() {

        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.check_all() // btn:全选
            },
            goods_nav_admin_button_click(e) {
                if (e.index == 0) this.submit_audit() // btn:审核确认
                if (e.index === 1) this.preview_pdf() // btn: 预览PDF
            },
            goods_nav_staff_button_click(e) {
                if (e.index == 0) this.submit_submit() // btn:提交
            },
            check_all() {
                let checked_all = !this.inv_plans.find(inv_plan => !inv_plan.disabled && !inv_plan.checked)
                this.inv_plans.forEach(inv_plan => {
                    if (!inv_plan.disabled) inv_plan.checked = !checked_all
                })
            },
            checkbox_click(e) {
                let inv_plan = this.inv_plans.find(x => x.FID == e.target.dataset.id)
                if (inv_plan && !inv_plan.disabled) {
                    inv_plan.checked = !inv_plan.checked
                }  
            },
            list_item_click(inv_plan) {
                if (inv_plan.FDocumentStatu == 'A') {
                    uni.showActionSheet({
                        itemList: ['删除'],
                        success: (e) => {
                            if (e.tapIndex === 0) this.submit_delete(inv_plan) // 新建的计划可删除
                        }
                    })
                }
            },
            // #ifdef H5
            async preview_pdf() {
                let receiver = this.inv_plans[0]?.FReceiver
                if (!receiver) {
                    let response = await K3CloudApi.view('SAL_DELIVERYNOTICE', { Number: this.bill_no })
                    if (response.data.Result.ResponseStatus.IsSuccess) {
                        receiver = response.data.Result.Result.F_PAEZ_Text
                    }
                }
                let inv_plans = this.inv_plans.filter(x => x.checked)
                if (inv_plans.length === 0) inv_plans = this.inv_plans 
                let url = pdf_template_inv_plans_out(inv_plans, { receiver: receiver })
                uni.navigateTo({ url: `/pages/my/preview_pdf?url=${url}` }) // 打开预览页面
            },
            // #endif
            async load_inv_plans() {
                let options = { 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.bill_no,
                    FOpType: 'out'
                }
                uni.showLoading({ title: 'Loading' })
                InvPlan.query(options, {}).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        inv_plan.checked = false
                        if (store.state.role == 'wh_admin') {
                            inv_plan.disabled = !['A', 'B'].includes(inv_plan.FDocumentStatu)
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                        if (store.state.role == 'wh_staff') {
                            inv_plan.disabled = inv_plan.FDocumentStatu != 'A'
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        }
                    })
                })
            },
            async submit_audit() {
                // if (this.inv_plans.find(x => x.FDocumentStatu == 'A')) {
                //     uni.showToast({ icon: 'none', title: '还有未提交的条目' })
                //     return
                // }
                let checked_inv_plans = this.inv_plans.filter(x => x.checked)
                let save_ids = checked_inv_plans.filter(x => x.FDocumentStatu == 'A').map(x => x.FID)
                if (save_ids.length) {
                    await InvPlan.submit(save_ids) // 提交(admin补)
                }
                let ids = checked_inv_plans.map(x => x.FID)
                if (ids.length) {
                    uni.showLoading({ title: 'Loading' })
                    let response = await InvPlan.audit(ids)
                    if (response.data.Result.ResponseStatus.IsSuccess) {
                        for (let i = 0; i < checked_inv_plans.length; i++) {
                            uni.showLoading({ title: `Loading:${i}/${checked_inv_plans.length}` })
                            await InvPlan.execute(checked_inv_plans[i])
                        }
                        await this.load_inv_plans()
                        uni.hideLoading()
                        uni.showToast({ title: '操作成功' })
                    } else {
                        uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                    }
                } else {
                    uni.showToast({ icon: 'none', title: '未选择任何条目' })
                }
            },
            async submit_submit() {
                let ids = this.inv_plans.filter(x => x.checked).map(x => x.FID)
                if (ids.length) {
                    uni.showLoading({ title: 'Loading' })
                    InvPlan.submit(ids).then(res => {
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            this.load_inv_plans()
                            // const eventChannel = this.getOpenerEventChannel()
                            // eventChannel.emit('reloadInvPlans', { reload: true })
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } else {
                    uni.showToast({ icon: 'none', title: '未选择任何条目' })
                }
            },
            async submit_delete(inv_plan) {
                if (inv_plan.FDocumentStatu == 'A') {
                    uni.showLoading({ title: 'Loading' })
                    return InvPlan.delete([inv_plan.FID]).then(res => {
                        uni.hideLoading()
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            play_audio_prompt('delete')
                            this.load_inv_plans()
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } else {
                    uni.showToast({ icon: 'error', title: '只能删除新增的计划' })
                }
            }
        }
    }
</script>

<style>

</style>
