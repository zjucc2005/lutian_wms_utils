<template>
    <uni-table v-if="$store.state.system_info.windowWidth >= 12000" ref="table" border stripe>
        <!-- <uni-tr>
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
        </uni-tr> -->
    </uni-table>
    
    <uni-list v-else>
        <uni-list-item
            v-for="(dn, index) in delivery_notices"
            :key="index"
            @click="show_delivery_notice(dn.FID)" clickable
            show-arrow
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ dn.FBillNo }}</view>
                    <view class="note">
                        <view>发货组织：{{ dn['FDeliveryOrgId.FName'] }}</view>
                        <view>收货人：{{ dn.F_PAEZ_Text }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view>{{ formatDate(dn.FDate, 'yyyy-MM-dd') }}</view>
                    <view :class="dn.FCloseStatus == 'A' ? 'text-primary' : ''">{{ $store.state.close_status_dict[dn.FCloseStatus] }}</view>
                </view>
            </template>
        </uni-list-item>
    </uni-list>
    
    <uni-load-more :status="load_more_status" @clickLoadMore="load_more" />
    
    <uni-fab ref="fab" :content="fab_content" @trigger="fab_trigger" show />
    
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            :style="{ width: $store.state.system_info.windowWidth - 20 + 'px', minWidth: '360px', maxWidth: '1200px' }"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" :label-width="100">
                    <uni-row :gutter="15">
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="单据编号">
                                <uni-easyinput v-model="search_form.bill_no" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="收货人">
                                <uni-easyinput v-model="search_form.receiver" />
                            </uni-forms-item>
                        </uni-col>
                        <uni-col :md="8" :sm="12" :xs="24">
                            <uni-forms-item label="关闭状态">
                                <uni-data-select v-model="search_form.close_status" 
                                    :localdata="[{ value: 'A', text: '未关闭' }, { value: 'B', text: '关闭' }]"></uni-data-select>
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
    import { SalDeliveryNotice } from '@/utils/model'
    import { link_to, truncate, formatDate } from '@/utils'
    
    export default {
        data() {
            return {
                delivery_notices: [],
                search_form: {
                    bill_no: '',
                    receiver: '',
                    close_status: ''
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
            this.reload_delivery_notices()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_delivery_notices()
        },
        methods: {
            truncate,
            formatDate,
            async load_delivery_notices() {
                let options = { FDocumentStatus: 'C', FDeliveryOrgId: store.state.cur_stock.FUseOrgId }
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                if (this.search_form.receiver) options.F_PAEZ_Text_lk = this.search_form.receiver
                if (this.search_form.close_status) options.FCloseStatus = this.search_form.close_status
                this.load_more_status = 'loading'
                SalDeliveryNotice.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.delivery_notices.push(item) )
                })
            },
            reload_delivery_notices() {
                this.delivery_notices = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_delivery_notices()
            },
            fab_trigger(e) {
                // console.log('this.$data', this.$data)
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_delivery_notices()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_delivery_notices()
                this.search_dialog_close()
            },
            show_delivery_notice(id) {
                link_to('/pages/k3cloud/xiaoshouguanli/fahuotongzhidan/show?id=' + id)
                // console.log('show_delivery_notice', id)
            }
        }
    }
</script>

<style lang="scss">
    .search-form {
        flex: 1;
    }
</style>
