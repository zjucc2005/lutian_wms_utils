<template>
    <uni-list>
        <uni-list-item
            v-for="(log, index) in issuemtr_logs"
            :key="index"
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ log['FMaterialId.FNumber']  }}</view>
                    <view class="note">
                        <view>名称：{{ log['FMaterialId.FName'] }}</view> 
                        <view>规格：{{ log['FMaterialId.FSpecification'] }}</view>
                        <view>供应商：<text class="text-primary">{{ log['FSupplierId.FName'] }}</text></view>
                        <view>批次：<text class="text-primary">{{ log.FBatchNo }}</text></view>
                        <view v-if="log.FBillNo?.trim()">单据：<text class="text-primary">{{ log.FBillNo }}</text></view>
                        <view v-if="log.FRemark?.trim()">备注：{{ log.FRemark }}</view>
                        <view>时间：{{ formatDate(log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view v-if="log.FOpType == 'send'" class="text-primary">{{ op_type_dict[log.FOpType] }}</view>
                    <view v-if="log.FOpType == 'receive'" class="text-error">{{ op_type_dict[log.FOpType] }}</view>
                    <view>{{ log['FOpQTY'] }} {{ log['FStockUnitId.FName'] }}</view>
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
            :title="category == 'statistic' ? '统计条件' :  '搜索条件'"
            cancelText="关闭"
            @close="search_dialog_close"
            @confirm="search_dialog_confirm"
            :before-close="true"
            style="width: 360px;"
            >
            <view class="search-form">
                <uni-forms ref="search_form" :model="search_form">
                    <uni-forms-item v-if="category == 'search'" label="开始时间">
                        <uni-datetime-picker type="date" v-model="search_form.create_time_ge" />
                    </uni-forms-item>
                    <uni-forms-item v-if="category == 'search'" label="结束时间">
                        <uni-datetime-picker type="date" v-model="search_form.create_time_le" />
                    </uni-forms-item>
                    <uni-forms-item label="物料编码">
                        <uni-easyinput v-model="search_form.material_no" />
                    </uni-forms-item>
                    <uni-forms-item v-if="category == 'search'" label="名称">
                        <uni-easyinput v-model="search_form.material_name" />
                    </uni-forms-item>
                    <uni-forms-item v-if="category == 'search'" label="规格">
                        <uni-easyinput v-model="search_form.material_spec" />
                    </uni-forms-item>
                    <uni-forms-item label="批次">
                        <uni-easyinput v-model="search_form.batch_no" />
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
    <uni-popup ref="summary_dialog" type="dialog">
        <uni-popup-dialog
            type="info"
            title="统计结果"
            cancelText="关闭"
            style="width: 360px;"
            >
            <view style="width: 100%;">
                <qiun-data-charts
                    type="column"
                    :opts="chart_opts"
                    :chart-data="chart_data"
                    ontouch
                    />
            </view>
        </uni-popup-dialog>
    </uni-popup>
    
</template>

<script>
    import store from '@/store'
    import { IssuemtrLog } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import db_model from '@/utils/db_model'
    
    export default {
        data() {
            return {
                category: 'search',  // search/statistic
                issuemtr_logs: [],
                search_form: {
                    create_time_ge: '',
                    create_time_le: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    batch_no: '',
                },
                page: 1,
                per_page: 20,
                load_more_status: 'more', // more,loading,nomore
                op_type_dict: IssuemtrLog.FOpTypeEnum,
                fab_content: [
                    {
                        iconPath: '/static/icon/cc_search.png',
                        selectedIconPath: '/static/icon/cc_search_active.png',
                        text: '搜索',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_barchart.png',
                        selectedIconPath: '/static/icon/cc_barchart_active.png',
                        text: '统计',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_gotop.png',
                        selectedIconPath: '/static/icon/cc_gotop_active.png',
                        text: '返回顶部',
                        active: false
                    }
                ],
                chart_opts: {
                    color: ["#1890FF","#EE6666"],
                    padding: [25,25,0,25],
                    extra: {
                        column: {
                            type: "group",
                            width: 36,
                            activeBgColor: "#000000",
                            activeBgOpacity: 0.08,
                            seriesGap: 5,
                            barBorderRadius: [5,5,5,5]
                        }
                    }
                },
                chart_data: {}
            }
        },
        onPullDownRefresh() {
            this.reload_issuemtr_logs()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        mounted() {
            this.load_issuemtr_logs()
        },
        methods: {
            formatDate,
            fab_trigger(e) {
                if (e.index === 0) {
                    this.category = 'search'
                    this.$refs.search_dialog.open()
                } 
                if (e.index === 1) {
                    this.category = 'statistic'
                    // this.$refs.summary_dialog.open()
                    // return
                    this.$refs.search_dialog.open()
                }
                if (e.index === 2) uni.pageScrollTo({ scrollTop: 0 })
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_issuemtr_logs()
            },
            reload_issuemtr_logs() {
                this.issuemtr_logs = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_issuemtr_logs()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                if (this.category == 'search') {
                    this.reload_issuemtr_logs()
                    this.search_dialog_close()
                }
                if (this.category == 'statistic') {
                    if (this.search_form.material_no && this.search_form.batch_no) {
                        this.summarize_logs()
                        this.search_dialog_close()
                    } else {
                        uni.showToast({ icon: 'none', title: '物料和批次必需' })
                    }
                }
            },
            async load_issuemtr_logs() {                
                let options = { 
                    // FStockId: store.state.cur_stock.FStockId,
                    FOpType_in: ['send', 'receive']
                }
                if (this.search_form.create_time_ge) options.FCreateTime_ge = this.search_form.create_time_ge
                if (this.search_form.create_time_le) options.FCreateTime_le = this.search_form.create_time_le
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FModel_lk'] = this.search_form.material_spec
                if (this.search_form.bill_no) options.FBillNo = this.search_form.bill_no
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                this.load_more_status = 'loading'
                IssuemtrLog.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.issuemtr_logs.push(item) )
                })
            },
            async summarize_logs() {
                let options = {
                    FOpType_in: ['send', 'receive'],
                    'FMaterialId.FNumber': this.search_form.material_no,
                    'FBatchNo': this.search_form.batch_no
                }
                uni.showLoading({ title: 'Loading' })
                let res = await IssuemtrLog.summary(options)
                uni.hideLoading()
                if (res.length === 0) {
                    uni.showToast({ icon: 'none', title: '无相关数据' })
                    return
                } 
                let chart_data = {
                    categories: [[this.search_form.material_no, this.search_form.batch_no].join(' / ')],
                    series: []
                }
                let sum_send = 0
                let sum_receive = 0
                for (let item of res) {
                    if (item[0] == 'send') sum_send += item[1]
                    if (item[0] == 'receive') sum_receive += item[1]
                }
                chart_data.series.push({ name: "发料", data: [sum_send] })
                chart_data.series.push({ name: "用料", data: [sum_receive] })
                this.chart_data = chart_data
                this.$refs.summary_dialog.open()
            }
        }
    }
</script>

<style lang="scss">
    .search-form {
        flex: 1;
    }
</style>
