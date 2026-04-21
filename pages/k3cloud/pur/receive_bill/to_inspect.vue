<template>
    <uni-section title="收料通知单" type="square" class="above-uni-goods-nav" @click="$logger.info('>>>', $data)">
        <template #right>
            <view style="display: flex;" @click="show_push_tips()">
                <uni-icons type="info" size="18" color="#007aff"></uni-icons>
                <text class="text-sm text-primary">下推条件</text>
            </view>
        </template>
        <uni-list>
            <uni-list-item v-for="(rb, index) in receive_bills" :key="index">
                <template #header>
                    <view class="uni-list-item__head">                    
                        <checkbox :checked="cart.has(rb.FDetailEntity_FEntryId)" @click="checkbox_click" :data-id="rb.FDetailEntity_FEntryId" />
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">{{ rb['FMaterialId.FNumber'] }} / {{ rb['FMaterialId.FName'] }}</view>
                        <view class="note">
                            <view>规格：{{ rb['FMaterialId.FSpecification'] }}</view>
                            <view>单据：
                                <text class="text-primary">{{ rb.FBillNo }}</text>, 
                                <text class="text-primary">{{ rb.F_PAEZ_Text }}</text>
                            </view>
                            <view>供应商：{{ rb['FSupplierId.FName'] }}</view>
                            <view>采购员：{{ rb['FPurchaserId.FName'] }}, 创建日期：{{ formatDate(rb.FCreateDate, 'yyyy-MM-dd') }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ rb.FActReceiveQty }} {{ rb['FUnitId.FName'] }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
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
    
    <uni-drawer ref="cart_drawer" :width="$store.state.drawer_width">
        <scroll-view scroll-y style="height: 100%;" @touchmove.stop>
            <uni-section :title="`已选择 ${cart.size} 行`" type="square">
                <template v-slot:right>
                    <view class="uni-section__right">
                        <uni-icons type="closeempty" size="24" color="#333" @click="$refs.cart_drawer.close()"/>
                    </view>
                </template>
                <uni-list>
                    <uni-list-item v-for="(id, index) in cart" :key="index">
                        <template #body>
                            <view class="uni-list-item__body">
                                <view class="title">{{ receive_bills_cache[id]['FMaterialId.FNumber'] }} / {{ receive_bills_cache[id]['FMaterialId.FName'] }}</view>
                                <view class="note">
                                    <view>规格：{{ receive_bills_cache[id]['FMaterialId.FSpecification'] }}</view>
                                    <view>单据：
                                        <text class="text-primary">{{ receive_bills_cache[id].FBillNo }}</text>, 
                                        <text class="text-primary">{{ receive_bills_cache[id].F_PAEZ_Text }}</text>
                                    </view>
                                    <view>供应商：{{ receive_bills_cache[id]['FSupplierId.FName'] }}</view>
                                    <view>采购员：{{ receive_bills_cache[id]['FPurchaserId.FName'] }}, 创建日期：{{ formatDate(receive_bills_cache[id].FCreateDate, 'yyyy-MM-dd') }}</view>
                                </view>
                            </view>
                        </template>
                        <template #footer>
                            <view class="uni-list-item__foot">
                                <view>{{ receive_bills_cache[id].FActReceiveQty }} {{ receive_bills_cache[id]['FUnitId.FName'] }}</view>
                            </view>
                        </template>
                    </uni-list-item>
                </uni-list>
            </uni-section>
        </scroll-view>
    </uni-drawer>
    
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="$refs.search_dialog.close()"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" :label-width="70">
                    <uni-row :gutter="15">
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="单据编号">
                                <uni-easyinput
                                    v-model="search_form.bill_no"
                                    trim="both"
                                    prefix-icon="scan"
                                    @icon-click="searchbar_icon_click"
                                />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="需求单据">
                                <uni-easyinput v-model="search_form.demand_bill_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="需求人">
                                <uni-easyinput v-model="search_form.demander" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="供应商">
                                <uni-easyinput v-model="search_form.supplier" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="物料编码">
                                <uni-easyinput
                                    v-model="search_form.material_no"
                                    trim="both"
                                    prefix-icon="scan"
                                    @icon-click="searchbar_icon_click"
                                />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="物料名称">
                                <uni-easyinput v-model="search_form.material_name" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="规格型号">
                                <uni-easyinput v-model="search_form.material_spec" />
                            </uni-forms-item>
                        </uni-col>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <uni-popup ref="push_dialog" type="dialog">
        <uni-popup-dialog
            type="error"
            title="参数选择"
            @close="$refs.push_dialog.close()"
            @confirm="submit_push"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="push-form">
                <uni-forms ref="push_form" :model="push_form" :label-width="70">
                    <uni-row :gutter="15">
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="转换规则">
                                <uni-data-select v-model="push_form.rule_id" :clear="false"
                                    :localdata="[{ text: '采购收料单推检验单转换规则', value: 'QM_PURReceive2Inspect' }]" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="单据类型">
                                <uni-data-select v-model="push_form.target_form_id" :clear="false"
                                    :localdata="[{ text: '来料检验单', value: 'QM_InspectBill' }]" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="目标组织">
                                <uni-data-select v-model="push_form.target_org_id" :clear="false" :localdata="org_options" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="检验部门">
                                <uni-data-select v-model="push_form.inspect_dep" :localdata="inspect_dep_options" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="质检组">
                                <uni-data-select v-model="push_form.inspect_group" :localdata="inspect_group_options" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="质检员">
                                <uni-data-select v-model="push_form.inspector"
                                    :localdata="[{ text: $store.state.cur_staff.FName, value: $store.state.cur_staff.FNumber }]" />
                            </uni-forms-item>
                        </uni-col>
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
</template>

<script>
    import store from '@/store'
    import { PurReceiveBill, QmInspectBill } from '@/utils/model'
    import { formatDate } from '@/utils'
    import scan_code from '@/utils/scan_code'
    
    export default {
        data() {
            return {
                receive_bills: [],
                receive_bills_cache: {},
                cart: new Set(), // 已选择
                search_form: {
                    bill_no: '',
                    demand_bill_no: '',
                    demander: '',
                    supplier: '',
                    material_no: '',
                    material_name: '',
                    material_spec: ''
                },
                page: 1,
                per_page: 100,
                load_more_status: 'more', // more,loading,nomore
                push_form: {
                    rule_id: 'QM_PURReceive2Inspect',
                    target_form_id: 'QM_InspectBill',
                    target_org_id: 100006,
                    inspect_dep: '',
                    inspect_group: '',
                    inspector: store.state.cur_staff.FNumber
                },
                inspect_dep_options: [{ text: '品管一部', value: 'BM10202' }],
                inspect_group_options: [{ text: '内燃机质检组', value: '106' }],
                org_options: store.state.org_enum.map(e => { return { text: e[2], value: e[0] } }),
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '已选择', info: 0 },
                        { icon: 'search', text: '搜索'},
                        { icon: 'more-filled', text: '选项' }
                    ],
                    button_group: [
                        { text: '下推', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        // onPullDownRefresh() {
        //     this.reload_receive_bills()
        //     uni.stopPullDownRefresh()
        // },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_receive_bills()
        },
        methods: {
            formatDate,
            show_push_tips() {
                uni.showModal({
                    title: '下推条件',
                    content: [
                        '1. 收料单的单据状态为“已审核”',
                        '2. 收料单分录的“来料检验”复选框选中',
                        '3. 收料单分录的实收数量-检验关联数量>0'
                    ].join('\n')
                })
            },
            checkbox_click(e) {
                // console.log('checkbox click e', e)
                let id = e.currentTarget.dataset.id
                if (this.cart.has(id)) {
                    this.cart.delete(id)
                } else {
                    this.cart.add(id)
                    this.receive_bills_cache[id] = this.receive_bills.find(x => x.FDetailEntity_FEntryId === id)
                }
                this.goods_nav.options[0].info = this.cart.size
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    this.$logger.info('>>> data', this.$data)
                    if (this.cart.size) {
                        this.$refs.cart_drawer.open()
                    } else {
                        uni.showModal({ title: '提示', content: '请选择下推的数据行' })
                    }
                }
                if (e.index === 1) this.$refs.search_dialog.open()
                if (e.index === 2) this.more_actions()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.push_dialog_open() // btn:下推
            },
            more_actions() {
                uni.showActionSheet({
                    itemList: ['全选', '清空'],
                    success: (e) => {
                        if (e.tapIndex === 0) {
                            for (let rb of this.receive_bills) {
                                this.cart.add(rb.FDetailEntity_FEntryId)
                                this.receive_bills_cache[rb.FDetailEntity_FEntryId] = rb
                                this.goods_nav.options[0].info = this.cart.size
                            }
                        } 
                        if (e.tapIndex === 1) {
                            this.cart.clear()
                            this.goods_nav.options[0].info = this.cart.size
                        }
                    }
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            scan_code() {
                scan_code().then(res => {
                    this.handle_scan_code(res.result)
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            handle_scan_code(text) {
                if (text.startsWith('CGSL')) {
                    this.search_form.bill_no = text
                } else {
                    this.search_form.material_no = text
                }
            },
            async load_receive_bills() {
                let options = { FDocumentStatus: 'C', FCheckInComing: 1, FMustQty_gt: ':FCheckJoinQty' }
                let meta = { fields: 'FDetailEntity_FEntryId', page: this.page, per_page: this.per_page, order: 'FID DESC' }
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                if (this.search_form.demand_bill_no) options.F_PAEZ_Text_lk = this.search_form.demand_bill_no
                if (this.search_form.demander) options['FDemanderId.FName_lk'] = this.search_form.demander
                if (this.search_form.supplier) options['FSupplierId.FName_lk'] = this.search_form.supplier
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialId.FName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FMaterialId.FSpecification_lk'] = this.search_form.material_spec
                this.load_more_status = 'loading'
                PurReceiveBill.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.receive_bills.push(item) )
                })
            },
            reload_receive_bills() {
                this.receive_bills = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_receive_bills()
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_receive_bills()
                this.$logger.info('>>> load page', this.page)
            },
            search_dialog_confirm() {
                this.reload_receive_bills()
                this.$refs.search_dialog.close()
                uni.pageScrollTo({ scrollTop: 0 })
            },
            // 下推
            push_dialog_open() {
                if (this.cart.size) {
                    this.$refs.push_dialog.open()
                } else {
                    uni.showModal({ title: '提示', content: '请选择下推的数据行' })
                }
            },
            async submit_push() {
                try {
                    uni.showLoading({ title: 'Loading' })
                    let data = {
                        EntryIds: Array.from(this.cart).join(','),
                        RuleId: this.push_form.rule_id,
                        TargetOrgId: this.push_form.target_org_id
                    }
                    let res = await PurReceiveBill.push(data)
                    if (res.data.Result.ResponseStatus.IsSuccess) {
                        let ids = []
                        for (let entity of res.data.Result.ResponseStatus.SuccessEntitys) {
                            ids.push(entity.Id)
                            await QmInspectBill.update(entity.Id, {
                                FInspectDepId: { FNumber: this.push_form.inspect_dep },
                                FInspectGroupId: { FNumber: this.push_form.inspect_group },
                                FInspectorId: { FNumber: this.push_form.inspector }
                            })
                        }
                        if (ids.length) {
                            await QmInspectBill.submit(ids)
                            await QmInspectBill.audit(ids)
                        } 
                    }
                    // after action
                    this.cart.clear()
                    this.goods_nav.options[0].info = this.cart.size
                    this.$refs.push_dialog.close()
                    this.reload_receive_bills()
                    uni.hideLoading()
                    uni.showToast({ title: '下推成功' })
                } catch (err) {
                    this.$logger.info('>>> err', err)
                }
            },
            
            
        }
    }
</script>

<style lang="scss" scoped>
    .push-form {
        flex: 1;
    }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
