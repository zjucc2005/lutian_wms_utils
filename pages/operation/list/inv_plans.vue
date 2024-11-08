<template>
    <uni-list>
        <uni-list-item
            v-for="(inv_plan, index) in inv_plans"
            :key="index"
            >
            <template #body>
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
                        <view v-if="inv_plan.FBillNo?.trim()">单据：{{ inv_plan.FBillNo }}</view>
                        <view v-if="inv_plan.FRemark?.trim()">备注：{{ inv_plan.FRemark }}</view>
                        <view>时间：{{ formatDate(inv_plan.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view v-if="['in', 'add'].includes(inv_plan.FOpType)" class="text-error">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view v-if="['out', 'sub'].includes(inv_plan.FOpType)" class="text-primary">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view v-if="['mv'].includes(inv_plan.FOpType)">{{ op_type_dict[inv_plan.FOpType] }}</view>
                    <view>{{ inv_plan['FOpQTY'] }} {{ inv_plan['FStockUnitId.FName'] }}</view>
                    <view class="text-primary">{{ $store.state.document_status_dict[inv_plan.FDocumentStatu] }}</view>
                </view>
            </template>
        </uni-list-item>
    </uni-list>
    
    <uni-load-more :status="load_more_status" @clickLoadMore="load_more" />
    
    <uni-fab ref="fab" :content="fab_content" @trigger="fab_trigger" show />
    
    <!-- search form -->
    <uni-popup ref="search_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="搜索条件"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            style="width: 360px;"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form" >
                    <uni-forms-item label="开始时间">
                        <uni-datetime-picker type="date" v-model="search_form.create_time_ge" />
                    </uni-forms-item>
                    <uni-forms-item label="结束时间">
                        <uni-datetime-picker type="date" v-model="search_form.create_time_le" />
                    </uni-forms-item>
                    <uni-forms-item label="物料编码">
                        <uni-easyinput v-model="search_form.material_no" />
                    </uni-forms-item>
                    <uni-forms-item label="名称">
                        <uni-easyinput v-model="search_form.material_name" />
                    </uni-forms-item>
                    <uni-forms-item label="规格">
                        <uni-easyinput v-model="search_form.material_spec" />
                    </uni-forms-item>
                    <uni-forms-item label="单据编号">
                        <uni-easyinput v-model="search_form.bill_no" />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { InvPlan } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import db_model from '@/utils/db_model'
    
    export default {
        data() {
            return {
                inv_plans: [],
                search_form: {
                    create_time_ge: '',
                    create_time_le: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    bill_no: ''
                },
                page: 1,
                per_page: 20,
                load_more_status: 'more', // more,loading,nomore
                op_type_dict: InvPlan.FOpTypeEnum,
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
                // tr_fields: {
                //     FOpType: "操作类型",
                //     FOpQTY: "操作数量",
                //     'FMaterialId.FName': "名称",
                //     'FMaterialId.FSpecification': '规格',
                //     'FMaterialId.FNumber': "物料编码",
                //     'FStockUnitId.FName': '计量单位',
                //     'FStockLocId.FNumber': "库位号",
                //     FBatchNo: "批次号",
                //     'FDestStockLocId.FNumber': "目标库位号",
                //     FBillNo: "单据编号",
                //     FRemark: "备注",
                //     FDocumentStatu: "状态",
                //     FOpStaffNo: "员工编号",
                //     FCreateTime: "新建时间"
                // },
                

            }
        },
        onPullDownRefresh() {
            this.reload_inv_plans()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_inv_plans()
        },
        methods: {
            formatDate,
            fab_trigger(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_inv_plans()
            },
            reload_inv_plans() {
                this.inv_plans = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_inv_plans()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_inv_plans()
                this.search_dialog_close()
            },
            async load_inv_plans() {
                let options = { FStockId: store.state.cur_stock.FStockId }
                if (this.search_form.create_time_ge) options.FCreateTime_ge = this.search_form.create_time_ge
                if (this.search_form.create_time_le) options.FCreateTime_le = this.search_form.create_time_le
                if (this.search_form.material_no) options['FMaterialId.FNumber_cont'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialName_cont'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FModel_cont'] = this.search_form.material_spec
                if (this.search_form.bill_no) options.FBillNo = this.search_form.bill_no
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                this.load_more_status = 'loading'
                InvPlan.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.inv_plans.push(item) )
                })
            },
        }
    }
</script>

<style lang="scss">
    .search-form {
        flex: 1;
    }
</style>
