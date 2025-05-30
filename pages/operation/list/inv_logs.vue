<template>
    <uni-table v-if="$store.state.system_info.windowWidth >= 1200" ref="table" border stripe>
        <uni-tr>
            <uni-th align="center" width="160">时间</uni-th>
            <uni-th align="center" width="80">操作类型</uni-th>
            <uni-th align="center" width="60">数量</uni-th>
            <uni-th align="center" width="80">计量单位</uni-th>
            <uni-th align="center" width="160">物料编码</uni-th>
            <uni-th align="center" width="200">物料名称</uni-th>
            <uni-th align="center">规格型号</uni-th>
            <uni-th align="center" width="80">批次</uni-th>
            <uni-th align="center" width="120">库位</uni-th>
            <uni-th align="center">单据编号</uni-th>
            <uni-th align="center" width="80">收货人</uni-th>
            <uni-th align="center">备注</uni-th>
            <uni-th align="center" width="120">操作员工编号</uni-th>
            <uni-th align="center" width="80">状态</uni-th>
        </uni-tr>
        <uni-tr v-for="(inv_log, index) in inv_logs" :key="index">
            <uni-td>{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</uni-td>
            <uni-td>
                <view v-if="['in', 'add'].includes(inv_log.FOpType)" class="text-error">{{ op_type_dict[inv_log.FOpType] }}</view>
                <view v-if="['out', 'sub'].includes(inv_log.FOpType)" class="text-primary">{{ op_type_dict[inv_log.FOpType] }}</view>
                <view v-if="['mv'].includes(inv_log.FOpType)">{{ op_type_dict[inv_log.FOpType] }}</view>
            </uni-td>
            <uni-td>{{ inv_log['FOpQTY'] }}</uni-td>
            <uni-td>{{ inv_log['FStockUnitId.FName'] }}</uni-td>
            <uni-td>{{ inv_log['FMaterialId.FNumber'] }}</uni-td>
            <uni-td>{{ inv_log['FMaterialId.FName'] }}</uni-td>
            <uni-td>{{ inv_log['FMaterialId.FSpecification'] }}</uni-td>
            <uni-td>{{ inv_log.FBatchNo }}</uni-td>
            <uni-td>{{ inv_log['FStockLocId.FNumber'] }}</uni-td>
            <uni-td>{{ inv_log.FBillNo }}</uni-td>
            <uni-td>{{ inv_log.FReceiver }}</uni-td>
            <uni-td>{{ inv_log.FRemark }}</uni-td>
            <uni-td>{{ inv_log.FOpStaffNo }}</uni-td>
            <uni-td><text class="text-primary">{{ $store.state.document_status_dict[inv_log.FDocumentStatu] }}</text></uni-td>
        </uni-tr>
    </uni-table>
    
    <uni-list v-else>
        <uni-list-item
            v-for="(inv_log, index) in inv_logs"
            :key="index"
            :show-extra-icon="!inv_log.FCInvId"
            :extra-icon="{ type: 'loop', size: '24', color: '#dd524d' }"
            @click="inv_log_menu(inv_log)"
            :clickable="!inv_log.FCInvId"
            :show-arrow="!inv_log.FCInvId"
            >
            <template #body>
                <view class="uni-list-item__body">
                    <view class="title">{{ inv_log['FMaterialId.FNumber'] }} / {{ inv_log['FMaterialId.FName'] }}</view>
                    <view class="note">
                        <!-- <view>名称：{{ inv_log['FMaterialId.FName'] }}</view> -->
                        <view>规格：{{ inv_log['FMaterialId.FSpecification'] }}</view>
                        <!-- <view>批次：{{ inv_log.FBatchNo }}</view> -->
                        <view>
                            库位：<text class="text-default">{{ inv_log['FStockLocId.FNumber'] }}</text>
                            <template v-if="inv_log.FOpType == 'mv'">
                                <uni-icons type="redo" color="#007bff"></uni-icons>
                                <text class="text-primary uni-ml-2">{{ inv_log['FDestStockLocId.FNumber'] }}</text>
                            </template>
                            <text class="uni-ml-5">批次：{{ inv_log.FBatchNo }}</text>
                        </view>
                        <view v-if="inv_log.FBillNo?.trim()">单据：{{ inv_log.FBillNo }}</view>
                        <view v-if="inv_log.FReceiver?.trim()">收货人：{{ inv_log.FReceiver }}</view>
                        <view v-if="inv_log.FRemark?.trim()">备注：{{ inv_log.FRemark }}</view>
                        <view>时间：{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                        <view v-if="!inv_log.FCInvId" class="text-error">库存未更新，请点击重试</view>
                    </view>
                </view>
            </template>
            <template #footer>
                <view class="uni-list-item__foot">
                    <view v-if="['in', 'add'].includes(inv_log.FOpType)" class="text-error">{{ op_type_dict[inv_log.FOpType] }}</view>
                    <view v-if="['out', 'sub'].includes(inv_log.FOpType)" class="text-primary">{{ op_type_dict[inv_log.FOpType] }}</view>
                    <view v-if="['mv_in', 'mv_out'].includes(inv_log.FOpType)">{{ op_type_dict[inv_log.FOpType] }}</view>
                    <view>{{ inv_log['FOpQTY'] }} {{ inv_log['FStockUnitId.FName'] }}</view>
                    <view class="text-primary">{{ $store.state.document_status_dict[inv_log.FDocumentStatu] }}</view>
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
                    <uni-forms-item label="操作类型">
                        <uni-data-select v-model="search_form.op_type" :localdata="op_type_options"></uni-data-select>
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
                    <uni-forms-item label="收货人">
                        <uni-easyinput v-model="search_form.receiver" />
                    </uni-forms-item>
                    <uni-forms-item label="状态">
                        <uni-data-select v-model="search_form.status" :localdata="[{ value: 'failed', text: '失败' }]"></uni-data-select>
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-popup-dialog>
    </uni-popup>
</template>

<script>
    import store from '@/store'
    import { InvPlan, InvLog } from '@/utils/model'
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    import db_model from '@/utils/db_model'
    
    export default {
        props: {
            material_no: {
                type: String
            }
        },
        data() {
            return {
                inv_logs: [],
                search_form: {
                    create_time_ge: '',
                    create_time_le: '',
                    op_type: '',
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    bill_no: '',
                    receiver: '',
                    status: ''
                },
                page: 1,
                per_page: 25,
                load_more_status: 'more', // more,loading,nomore
                op_type_dict: InvLog.FOpTypeEnum,
                fab_content: [
                    {
                        iconPath: '/static/icon/cc_search.png',
                        selectedIconPath: '/static/icon/cc_search_active.png',
                        text: '搜索',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_inbound.png',
                        selectedIconPath: '/static/icon/cc_inbound_active.png',
                        text: '入库',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_outbound.png',
                        selectedIconPath: '/static/icon/cc_outbound_active.png',
                        text: '出库',
                        active: false
                    },
                    {
                        iconPath: '/static/icon/cc_warn.png',
                        selectedIconPath: '/static/icon/cc_warn_active.png',
                        text: '失败',
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
            this.reload_inv_logs()
            uni.stopPullDownRefresh()
        },
        onReachBottom() {
            this.load_more()
        },
        onLoad(options) {
            if (options.material_no) {
                this.search_form.material_no = options.material_no
            }
        },
        mounted() {
            this.load_inv_logs()
        },
        computed: {
            op_type_options() {
                return Object.getOwnPropertyNames(this.op_type_dict).map(x => {
                    return { value: x, text: this.op_type_dict[x] }
                })
            }  
        },
        methods: {
            formatDate,
            fab_icon_active(index) {
                for (let i = 0; i < this.fab_content.length; i++) {
                    if (i == index) {
                        this.fab_content[i].active = true
                    } else {
                        this.fab_content[i].active = false
                    }
                }
            },
            fab_trigger(e) {
                // console.log('this.$data', this.$data)
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) {
                    this.search_form = { op_type: 'in' }
                    this.reload_inv_logs()
                    this.fab_icon_active(1)
                }
                if (e.index === 2) {
                    this.search_form = { op_type: 'out' }
                    this.reload_inv_logs()
                    this.fab_icon_active(2)
                }
                if (e.index === 3) {
                    this.search_form = { status: 'failed' }
                    this.reload_inv_logs()
                    this.fab_icon_active(3)
                }
                if (e.index === 4) uni.pageScrollTo({ scrollTop: 0 })
            },
            inv_log_menu(inv_log) {
                if (!inv_log.FCInvId) {
                    uni.showActionSheet({
                        itemList: ['全部重试'],
                        success: (e) => {
                            if (e.tapIndex === 0) this.retry_all()
                        }
                    })
                }
            },
            load_more() {
                if (this.load_more_status == 'nomore') return
                this.page += 1
                this.load_inv_logs()
            },
            reload_inv_logs() {
                this.inv_logs = []
                this.load_more_status = 'more'
                this.page = 1
                this.load_inv_logs()
            },
            search_dialog_close() {
                this.$refs.search_dialog.close()
            },
            search_dialog_confirm() {
                this.reload_inv_logs()
                this.search_dialog_close()
            },
            async load_inv_logs() {
                let options = { FStockId: store.state.cur_stock.FStockId }
                if (this.search_form.create_time_ge) options.FCreateTime_ge = this.search_form.create_time_ge
                if (this.search_form.create_time_le) options.FCreateTime_le = this.search_form.create_time_le
                if (this.search_form.op_type) options.FOpType = this.search_form.op_type
                if (this.search_form.op_type == 'in') { this.fab_icon_active(1) }
                else if (this.search_form.op_type == 'out') { this.fab_icon_active(2) }
                else if (this.search_form.status == 'failed') { this.fab_icon_active(3) }
                else { this.fab_icon_active(-1) }
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FModel_lk'] = this.search_form.material_spec
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                if (this.search_form.receiver) options.FReceiver_lk = this.search_form.receiver
                if (this.search_form.status == 'failed') options.FCInvId = ''
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                this.load_more_status = 'loading'
                InvLog.query(options, meta).then(res => {
                    this.load_more_status = res.data.length < this.per_page ? 'nomore' : 'more'
                    res.data.forEach(item => this.inv_logs.push(item) )
                })
            },
            // 重试全部失败的日志，金蝶插件脚本有时会不执行，此处为人工触发重试
            async retry_all() {
                let options = { 
                    FStockId: store.state.cur_stock.FStockId,
                    FCInvId: ''
                }
                let meta = { order: 'FID ASC' }
                uni.showLoading({ title: '重试中' })
                let res = await InvLog.query(options, meta)
                for (let inv_log of res.data) {
                    await InvLog.retry(inv_log)
                }
                uni.hideLoading()
                this.inv_logs = []
                this.search_form.status = 'failed'
                this.load_more_status = 'more'
                this.page = 1
                this.load_inv_logs()
            }
        }
    }
</script>

<style lang="scss">
    .search-form {
        flex: 1;
    }
</style>
