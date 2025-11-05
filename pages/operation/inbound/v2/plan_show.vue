<template>
    <!-- H5 -->
    <template v-if="$store.state.screen_type === 'h5'">
        <uni-section title="入库计划" type="square"
            :sub-title="bill_no" class="above-uni-goods-nav">
            <uni-table ref="table" border stripe>
                <uni-tr>
                    <uni-th align="center" width="30"></uni-th>
                    <uni-th align="center" width="60">序号</uni-th>
                    <uni-th align="center">物料编号</uni-th>
                    <uni-th align="center">物料名称</uni-th>
                    <uni-th align="center">规格型号</uni-th>
                    <uni-th align="center" width="80">操作类型</uni-th>
                    <uni-th align="center" width="60">数量</uni-th>
                    <uni-th align="center" width="80">单位</uni-th>
                    <uni-th align="center" width="120">库位</uni-th>
                    <uni-th align="center" width="80">批次</uni-th>
                    <uni-th align="center">供应商</uni-th>
                    <uni-th align="center" width="80">状态</uni-th>
                    <uni-th align="center" width="160">时间</uni-th>
                    <uni-th align="center" width="80">操作</uni-th>
                </uni-tr>
                <uni-tr v-for="(inv_plan, index) in inv_plans" :key="index">
                    <uni-td>
                        <checkbox
                            :checked="inv_plan.checked"
                            :disabled="inv_plan.disabled"
                            @click="checkbox_click"
                            :data-id="inv_plan.FID"
                        />
                    </uni-td>
                    <uni-td align="center">{{ index + 1 }}</uni-td>
                    <uni-td>{{ inv_plan['FMaterialId.FNumber'] }}</uni-td>
                    <uni-td>{{ inv_plan['FMaterialId.FName'] }}</uni-td>
                    <uni-td>{{ inv_plan['FMaterialId.FSpecification'] }}</uni-td>
                    <uni-td>{{ op_type_dict[inv_plan.FOpType] }}</uni-td>
                    <uni-td>{{ inv_plan['FOpQTY'] }}</uni-td>
                    <uni-td>{{ inv_plan['FStockUnitId.FName'] }}</uni-td>
                    <uni-td>{{ inv_plan['FStockLocId.FNumber'] }}</uni-td>
                    <uni-td>{{ inv_plan.FBatchNo }}</uni-td>
                    <uni-td>{{ inv_plan['FSupplierId.FName'] }}</uni-td>
                    <uni-td>
                        <text :class="[inv_plan.disabled ? 'text-error' : 'text-primary']">{{ inv_plan.status }}</text>
                    </uni-td>
                    <uni-td>{{ formatDate(inv_plan.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</uni-td>
                    <uni-td align="center">
                        <uni-tag v-if="inv_plan.FDocumentStatu == 'A'"
                            text="删除" type="error" @click="if_submit_delete(inv_plan)"/>
                    </uni-td>
                </uni-tr>
            </uni-table>
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
    </template>
    
    <!-- APP-PLUS -->
    <template v-else>
        <!-- <view v-if="$store.state.role.includes('admin')"> -->
            <uni-section title="入库计划" type="square"
                :sub-title="bill_no"
                class="above-uni-goods-nav">
                <uni-list>
                    <uni-list-item
                        v-for="(inv_plan, index) in inv_plans"
                        :key="index"
                        @click="list_item_click(inv_plan)" clickable
                        show-arrow
                        @longpress="list_item_click(inv_plan)"
                        >
                        <template #header>
                            <view class="uni-list-item__head">
                                <checkbox
                                    :checked="inv_plan.checked"
                                    :disabled="inv_plan.disabled"
                                    @click="checkbox_click"
                                    :data-id="inv_plan.FID"
                                />
                            </view>
                        </template>
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title">{{ inv_plan['FMaterialId.FNumber'] }}</view>
                                <view class="note">
                                    <view>名称：{{ inv_plan['FMaterialId.FName'] }}</view> 
                                    <view>规格：{{ inv_plan['FMaterialId.FSpecification'] }}</view>
                                    <view>
                                        库位：<text class="loc_no">{{ inv_plan['FStockLocId.FNumber'] }}</text>
                                    </view>
                                    <view>批次：{{ inv_plan['FBatchNo'] }}</view>
                                    <view v-if="inv_plan['FSupplierId.FName']">供应商：{{ inv_plan['FSupplierId.FName'] }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view class="op_qty">
                                    <uni-icons type="arrow-up" size="18" color="#dd524d"></uni-icons>
                                    <text>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                                </view>
                                <text :class="[inv_plan.disabled ? 'text-error' : 'text-primary']">{{ inv_plan.status }}</text>
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
        <!-- </view> -->
        
        <!-- <view v-if="$store.state.role.includes('staff')">
            <uni-section title="入库计划" type="square"
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
                                    <view v-if="inv_plan['FSupplierId.FName']">供应商：{{ inv_plan['FSupplierId.FName'] }}</view>
                                </view>
                            </view>
                        </template>
                        <template v-slot:footer>
                            <view class="uni-list-item__foot">
                                <text>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</text>
                                <text :class="[inv_plan.disabled ? 'text-error' : 'text-primary']">{{ inv_plan.status }}</text>
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
        </view> -->
    </template>
</template>

<script>
    import store from '@/store'
    import { InvPlan } from '@/utils/model'
    import { formatDate, play_audio_prompt } from '@/utils'
    // #ifdef H5
    import { pdf_template_inv_plans_in } from '@/gen_pdf'
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
                op_type_dict: InvPlan.FOpTypeEnum,
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
                            backgroundColor: store.state.goods_nav_color.grey.blue,
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
            formatDate,
            goods_nav_click(e) {
                if (e.index === 0) this.check_all() // btn:全选
            },
            goods_nav_admin_button_click(e) {
                if (e.index === 0) this.submit_audit() // btn:审核确认
                if (e.index === 1) this.preview_pdf() // btn: 预览PDF
            },
            goods_nav_staff_button_click(e) {
                if (e.index === 0) this.submit_submit() // btn:提交
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
            preview_pdf() {
                let inv_plans = this.inv_plans.filter(x => x.checked)
                if (inv_plans.length === 0) inv_plans = this.inv_plans 
                let url = pdf_template_inv_plans_in(inv_plans)
                window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800') // 打开小窗口
            },
            // #endif
            if_submit_delete(inv_plan) {
                uni.showModal({
                    title: '删除',
                    content: '是否确定删除?',
                    success: (res) => {
                        if (res.confirm) this.submit_delete(inv_plan)
                    },
                    fail: (err) => {}
                })
            },
            async load_inv_plans() {
                let options = { 
                    FStockId: store.state.cur_stock.FStockId,
                    FBillNo: this.bill_no,
                    FOpType: 'in'
                }
                if (store.state.role == 'nrj_admin') {
                    // 仓管员只可见自己的计划
                    options['FMaterialId.F_PAEZ_Base1'] = store.state.cur_staff.FName
                }
                uni.showLoading({ title: 'Loading' })
                InvPlan.query(options, {}).then(res => {
                    uni.hideLoading()
                    this.inv_plans = res.data
                    this.inv_plans.forEach(inv_plan => {
                        inv_plan.checked = false
                        // if (store.state.role.includes('admin')) {
                            inv_plan.disabled = !['A', 'B'].includes(inv_plan.FDocumentStatu)
                            inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        // }
                        // if (store.state.role.includes('staff')) {
                        //     inv_plan.disabled = inv_plan.FDocumentStatu != 'A'
                        //     inv_plan.status = store.state.document_status_dict[inv_plan.FDocumentStatu]
                        // }
                    })
                })
            },
            async submit_audit() {
                let checked_inv_plans = this.inv_plans.filter(x => x.checked && ['A', 'B'].includes(x.FDocumentStatu))
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
                    uni.showToast({
                        icon: 'none', title: '未选择任何条目'
                    })
                }
            },
            async submit_submit() {
                let ids = this.inv_plans.filter(x => x.checked).map(x => x.FID)
                if (ids.length) {
                    uni.showLoading({ title: 'Loading' })
                    InvPlan.submit(ids).then(res => {
                        if (res.data.Result.ResponseStatus.IsSuccess) {
                            this.load_inv_plans()
                        } else {
                            uni.showToast({ icon: 'none', title: res.data.Result.ResponseStatus.Errors[0]?.Message })
                        }
                    })
                } else {
                    uni.showToast({
                        icon: 'none', title: '未选择任何条目'
                    })
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

<style lang="scss">
    @font-face {
        font-family: 'SourceHanSansCN-Normal';
        src: url('/static/font/SourceHanSansCN-Normal.ttf') format('truetype');
    }
</style>
