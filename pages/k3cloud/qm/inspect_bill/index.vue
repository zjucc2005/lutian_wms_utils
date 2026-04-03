<template>
    <uni-list>
        <uni-list-item v-for="(ib, index) in inspect_bills" :key="index"
            @click="show_inspect_bill(ib)" clickable
            show-arrow>
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ ib.FBillNo }}</view>
                    <view class="note">
                        <!-- <view>单据类型：{{ ib['FBillTypeId.FName'] }}</view> -->
                        <view>质检员：{{ ib['FInspectorId.FName'] }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view>{{ formatDate(ib.FCreateDate, 'yyyy-MM-dd') }}</view>
                    <view :class="ib.FDocumentStatus === 'C' ? 'text-primary' : ''">{{ $store.state.document_status_dict[ib.FDocumentStatus] }}</view>
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
                    </uni-row>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { QmInspectBill } from '@/utils/model'
    import { formatDate, link_to } from '@/utils'
    
    export default {
        data() {
            return {
                inspect_bills: [],
                search_form: {
                    bill_no: ''
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
            this.load_inspect_bills()
        },
        methods: {
            formatDate,
            async load_inspect_bills() {
                let options = { 'FBillTypeId.FName': '来料检验单' }
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                this.load_more_status = 'loading'
                QmInspectBill.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.inspect_bills.push(item) )
                })
            },
            reload_inspect_bills() {
                this.inspect_bills = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_inspect_bills()
            },
            fab_trigger(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_inspect_bills()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_inspect_bills()
                this.search_dialog_close()
            },
            show_inspect_bill(obj) {
                link_to(`/pages/k3cloud/qm/inspect_bill/show?bill_no=${obj.FBillNo}`)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .search-form {
        flex: 1;
    }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
