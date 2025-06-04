<template>
    <uni-table v-if="$store.state.system_info.windowWidth >= 1200" ref="table" border stripe>
        <uni-tr>
            <uni-th align="center" width="120">单据编号</uni-th>
            <uni-th align="center" width="120">创建日期</uni-th>
            <uni-th align="center" width="150">供应商</uni-th>
            <uni-th align="center" width="80">采购员</uni-th>
            <uni-th align="center" width="160">物料编码</uni-th>
            <uni-th align="center" width="200">物料名称</uni-th>
            <uni-th align="center">规格型号</uni-th>
            <uni-th align="center" width="80">交货数量</uni-th>
            <uni-th align="center" width="80">收料单位</uni-th>
            <uni-th align="center" width="120">需求单据编号</uni-th>            
        </uni-tr>
        
        <uni-tr v-for="(rb, index) in receive_bills" :key="index">
            <uni-td>{{ rb.FBillNo }}</uni-td>
            <uni-td>{{ formatDate(rb.FCreateDate, 'yyyy-MM-dd') }}</uni-td>
            <uni-td :title="rb['FSupplierId.FName']">{{ truncate(rb['FSupplierId.FName'], 8) }}</uni-td>
            <uni-td>{{ rb['FPurchaserId.FName'] }}</uni-td>
            <uni-td>{{ rb['FMaterialId.FNumber'] }}</uni-td>
            <uni-td>{{ rb['FMaterialId.FName'] }}</uni-td>
            <uni-td>{{ rb['FMaterialId.FSpecification'] }}</uni-td>
            <uni-td>{{ rb.FActReceiveQty }}</uni-td>
            <uni-td>{{ rb['FUnitId.FName'] }}</uni-td>
            <uni-td>{{ rb.F_PAEZ_Text }}</uni-td>
        </uni-tr>
    </uni-table>
    
    <uni-list v-else>
        <uni-list-item
            v-for="(rb, index) in receive_bills"
            :key="index"
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ rb.FBillNo }} / {{ rb.F_PAEZ_Text }}</view>
                    <view class="note">
                        <view>供应商：{{ rb['FSupplierId.FName'] }}</view>
                        <view>编码：{{ rb['FMaterialId.FNumber'] }}</view>
                        <view>名称：{{ rb['FMaterialId.FName'] }}</view>
                        <view>规格：{{ rb['FMaterialId.FSpecification'] }}</view>
                        <view>创建日期：{{ formatDate(rb.FCreateDate, 'yyyy-MM-dd') }}</view>
                        <view>采购员：{{ rb['FPurchaserId.FName'] }}</view>
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
    
    <uni-fab ref="fab" :content="fab_content" @trigger="fab_trigger" show />
    
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth + 'px', minWidth: '360px', maxWidth: '1200px' }"
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
    import { PurReceiveBill } from '@/utils/model'
    import { truncate } from '@/utils'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    
    export default {
        data() {
            return {
                receive_bills: [],
                search_form: {
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
            this.reload_receive_bills()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_receive_bills()
        },
        methods: {
            truncate,
            formatDate,
            async load_receive_bills() {
                let options = { }
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
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
            fab_trigger(e) {
                // console.log('this.$data', this.$data)
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_receive_bills()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_receive_bills()
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
