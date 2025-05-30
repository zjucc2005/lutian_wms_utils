<template>
    <uni-table ref="table" border stripe>
        <uni-tr>
            <uni-th align="center" width="120">单据编号</uni-th>
            <uni-th align="center" width="150">供应商</uni-th>
            <uni-th align="center" width="120">需求单据编号</uni-th>
            <uni-th align="center" width="160">物料编码</uni-th>
            <uni-th align="center" width="200">物料名称</uni-th>
            <uni-th align="center">规格型号</uni-th>
            <uni-th align="center" width="80">采购数量</uni-th>
            <uni-th align="center" width="80">剩余收料数量</uni-th>
            <uni-th align="center" width="96">采购日期</uni-th>
            <uni-th align="center" width="96">交货日期</uni-th>
            <uni-th align="center" width="80">采购员</uni-th>
        </uni-tr>
        
        <uni-tr v-for="(po, index) in purchase_orders" :key="index">
            <uni-td v-if="index > 0 && po.FBillNo == purchase_orders[index-1].FBillNo"></uni-td>
            <uni-td v-else>{{ po.FBillNo }}</uni-td>
            <uni-td :title="po['FSupplierId.FName']">{{ truncate(po['FSupplierId.FName'], 8) }}</uni-td>
            <uni-td>{{ po.FDemandBillNo }}</uni-td>
            <uni-td>{{ po['FMaterialId.FNumber'] }}</uni-td>
            <uni-td>{{ po['FMaterialId.FName'] }}</uni-td>
            <uni-td>{{ po['FMaterialId.FSpecification'] }}</uni-td>
            <uni-td>{{ po.FQty }}</uni-td>
            <uni-td>{{ po.FRemainReceiveQty }}</uni-td>
            <uni-td>{{ formatDate(po.FDate, 'yyyy-MM-dd') }}</uni-td>
            <uni-td>{{ formatDate(po.FDeliveryDate, 'yyyy-MM-dd') }}</uni-td>
            <uni-td>{{ po['FPurchaserId.FName'] }}</uni-td>
        </uni-tr>
    </uni-table>
    
    <uni-fab ref="fab" :content="fab_content" @trigger="fab_trigger" show />
    
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth + 'px', minWidth: '480px', maxWidth: '1200px' }"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" :label-width="100">
                    <uni-row :gutter="15">
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="需求单据编号">
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
                                <uni-easyinput v-model="search_form.material_no" />
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
</template>

<script>
    import store from '@/store'
    import { PurPurchaseOrder } from '@/utils/model'
    import { truncate } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    
    export default {
        data() {
            return {
                purchase_orders: [],
                search_form: {
                    demand_bill_no: '',
                    demander: '', // require_staff_id
                    supplier: '',
                    material_no: '',
                    material_name: '',
                    material_spec: ''
                },
                page: 1,
                per_page: 100,
                load_more_status: 'more', // more,loading,nomore
                fab_content: [
                    {
                        iconPath: '/static/icon/cc_search.png',
                        selectedIconPath: '/static/icon/cc_search_active.png',
                        text: '搜索',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_gotop.png',
                        selectedIconPath: '/static/icon/cc_gotop_active.png',
                        text: '返回顶部',
                        active: false
                    }
                ]
            }
        },
        onPullDownRefresh() {
            this.reload_purchase_orders()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_purchase_orders()
        },
        methods: {
            truncate,
            formatDate,
            async load_purchase_orders() {
                let options = { }
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                if (this.search_form.demand_bill_no) options.FDemandBillNo_lk = this.search_form.demand_bill_no
                if (this.search_form.demander) options['FRequireStaffId.FName_lk'] = this.search_form.demander
                if (this.search_form.supplier) options['FSupplierId.FName_lk'] = this.search_form.supplier
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FModel_lk'] = this.search_form.material_spec
                this.load_more_status = 'loading'
                PurPurchaseOrder.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.purchase_orders.push(item) )
                })
            },
            reload_purchase_orders() {
                this.purchase_orders = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_purchase_orders()
            },
            fab_trigger(e) {
                // console.log('this.$data', this.$data)
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_purchase_orders()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_purchase_orders()
                this.search_dialog_close()
            },
        }
    }
</script>

<style lang="scss">
    .search-form {
        // flex: 1;
    }
</style>
