<template>
    <uni-section title="当前仓库" type="square"
        :sub-title="breadcrumb_stockname()"
        sub-title-color="#007aff"
        @click="debug"
        >
        <uni-row v-if="$store.state.screen_type === 'h5'" >
            <uni-col :span="4">
                <uni-group title="搜索栏" mode="card" style="margin-top: 0;">
                    <uni-forms ref="search_form" :model="search_form" >
                        <uni-forms-item label="开始时间">
                            <uni-datetime-picker type="date" v-model="search_form.create_time_ge" />
                        </uni-forms-item>
                        <uni-forms-item label="结束时间">
                            <uni-datetime-picker type="date" v-model="search_form.create_time_le" />
                        </uni-forms-item>
                        <uni-forms-item label="操作类型">
                            <uni-data-select v-model="search_form.op_type" :localdata="op_type_options" />
                        </uni-forms-item>
                        <uni-forms-item label="物料编码">
                            <uni-easyinput v-model="search_form.material_no" trim />
                        </uni-forms-item>
                        <uni-forms-item label="物料名称">
                            <uni-easyinput v-model="search_form.material_name" trim />
                        </uni-forms-item>
                        <uni-forms-item label="规格型号">
                            <uni-easyinput v-model="search_form.material_spec" trim />
                        </uni-forms-item>
                        <uni-forms-item label="单据编号">
                            <uni-easyinput v-model="search_form.bill_no" trim />
                        </uni-forms-item>
                        <uni-forms-item label="收货人">
                            <uni-easyinput v-model="search_form.receiver" trim />
                        </uni-forms-item>
                        <uni-forms-item label="状态">
                            <uni-data-select v-model="search_form.status" :localdata="[{ value: 'failed', text: '失败' }]"></uni-data-select>
                        </uni-forms-item>
                    </uni-forms>
                    <button type="primary" size="mini" @click="search">搜索</button>
                    <button size="mini" @click="reset_search_form" class="uni-ml-5">重置</button>
                </uni-group>
                
                <uni-group title="其他操作" mode="card">
                    <button type="warn" size="mini" @click="retry_all">重试失败日志</button>
                </uni-group>
            </uni-col>
            
            <uni-col :span="20">
                <uni-table ref="table" stripe>
                    <uni-tr>
                        <uni-th align="center" width="160">时间</uni-th>
                        <uni-th align="center" width="160">物料编码</uni-th>
                        <uni-th align="center" width="200">物料名称</uni-th>
                        <uni-th align="center">规格型号</uni-th>
                        <uni-th align="center" width="80">操作类型</uni-th>
                        <uni-th align="center" width="60">数量</uni-th>
                        <uni-th align="center" width="60">单位</uni-th>
                        <uni-th align="center" width="120">库位</uni-th>
                        <uni-th align="center" width="80">批次</uni-th>
                        <uni-th align="center">单据编号</uni-th>
                        <uni-th align="center" width="80">收货人</uni-th>
                        <uni-th align="center">备注</uni-th>
                        <uni-th align="center" width="80">操作员工</uni-th>
                    </uni-tr>
                    <uni-tr v-for="(inv_log, index) in inv_logs" :key="index">
                        <uni-td>{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</uni-td>
                        <uni-td>{{ inv_log['FMaterialId.FNumber'] }}</uni-td>
                        <uni-td>{{ inv_log['FMaterialId.FName'] }}</uni-td>
                        <uni-td :title="inv_log['FMaterialId.FSpecification']">
                            {{ truncate(inv_log['FMaterialId.FSpecification'], 26) }}
                        </uni-td>
                        <uni-td align="center">
                            <view v-if="['in', 'add', 'out_cl'].includes(inv_log.FOpType)" class="text-error">{{ op_type_dict[inv_log.FOpType] }}</view>
                            <view v-if="['out', 'sub', 'in_cl'].includes(inv_log.FOpType)" class="text-primary">{{ op_type_dict[inv_log.FOpType] }}</view>
                            <view v-if="['mv_in', 'mv_out'].includes(inv_log.FOpType)">{{ op_type_dict[inv_log.FOpType] }}</view>
                        </uni-td>
                        <uni-td align="center">{{ inv_log['FOpQTY'] }}</uni-td>
                        <uni-td align="center">{{ inv_log['FStockUnitId.FName'] }}</uni-td>
                        <uni-td align="center">{{ inv_log['FStockLocId.FNumber'] }}</uni-td>
                        <uni-td align="center">{{ inv_log.FBatchNo }}</uni-td>
                        <uni-td align="center">{{ inv_log.FBillNo }}</uni-td>
                        <uni-td align="center" :title="inv_log.FReceiver">{{ truncate(inv_log.FReceiver, 3) }}</uni-td>
                        <uni-td :title="inv_log.FRemark">{{ truncate(inv_log.FRemark, 2) }}</uni-td>
                        <uni-td align="center">{{ inv_log.FOpStaffNo }}</uni-td>
                    </uni-tr>
                </uni-table>
                
                <uni-pagination
                    :total="total" 
                    :current="page" 
                    :page-size="per_page" 
                    show-icon
                    @change="change_page"
                    class="uni-mt-5"
                />
            </uni-col>
        </uni-row>
        
        <template v-else>
            <uni-list class="cc-list-scroll" :style="{ height: cc_list_height }">
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
                            <view class="title text-bold">{{ inv_log['FMaterialId.FNumber'] }} / {{ inv_log['FMaterialId.FName'] }}</view>
                            <view class="note">
                                <view>规格：{{ inv_log['FMaterialId.FSpecification'] }}</view>
                                <view>
                                    库位：<text class="text-default">{{ inv_log['FStockLocId.FNumber'] }}</text>
                                    <template v-if="inv_log.FOpType == 'mv'">
                                        <uni-icons type="redo" color="#007bff"></uni-icons>
                                        <text class="text-primary uni-ml-2">{{ inv_log['FDestStockLocId.FNumber'] }}</text>
                                    </template>
                                    <text class="uni-ml-5">批次：{{ inv_log.FBatchNo }}</text>
                                </view>
                                <view v-if="inv_log['FSupplierId.FName']">供应商：{{ inv_log['FSupplierId.FName'] }}</view>
                                <view>
                                    <text v-if="inv_log.FBillNo?.trim()" class="uni-mr-5">单据：{{ inv_log.FBillNo }}</text>
                                    <text v-if="inv_log.FReceiver?.trim()">收货人：{{ inv_log.FReceiver }}</text>
                                </view>
                                <view v-if="inv_log.FRemark?.trim()">备注：{{ inv_log.FRemark }}</view>
                                <view>时间：{{ formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss') }}</view>
                                <view v-if="!inv_log.FCInvId" class="text-error">库存未更新，请点击重试</view>
                            </view>
                        </view>
                    </template>
                    <template #footer>
                        <view class="uni-list-item__foot">
                            <view v-if="['in', 'add', 'out_cl'].includes(inv_log.FOpType)" class="text-error">{{ op_type_dict[inv_log.FOpType] }}</view>
                            <view v-if="['out', 'sub', 'in_cl'].includes(inv_log.FOpType)" class="text-primary">{{ op_type_dict[inv_log.FOpType] }}</view>
                            <view v-if="['mv_in', 'mv_out'].includes(inv_log.FOpType)">{{ op_type_dict[inv_log.FOpType] }}</view>
                            <view>{{ inv_log['FOpQTY'] }} {{ inv_log['FStockUnitId.FName'] }}</view>
                            <view class="text-primary">{{ $store.state.document_status_dict[inv_log.FDocumentStatu] }}</view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            
            <uni-pagination
                :total="total" 
                :current="page" 
                :page-size="per_page" 
                show-icon
                @change="change_page"
            />
            <view class="uni-goods-nav-wrapper">
                <uni-goods-nav 
                    :options="goods_nav.options" 
                    :button-group="goods_nav.button_group"
                    :fill="$store.state.goods_nav_fill"
                    @click="goods_nav_click"
                    @buttonClick="goods_nav_button_click"
                />
            </view>
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
                    <view style="flex: 1;">
                        <uni-forms ref="search_form" :model="search_form" >
                            <uni-row :gutter="15">
                                <uni-col :sm="12">
                                    <uni-forms-item label="开始时间">
                                        <uni-datetime-picker type="date" v-model="search_form.create_time_ge" />
                                    </uni-forms-item>
                                </uni-col>
                                <uni-col :sm="12">
                                    <uni-forms-item label="结束时间">
                                        <uni-datetime-picker type="date" v-model="search_form.create_time_le" />
                                    </uni-forms-item>
                                </uni-col>
                            </uni-row>
                            <uni-row :gutter="15">
                                <uni-col :sm="12">
                                    <uni-forms-item label="操作类型">
                                        <uni-data-select v-model="search_form.op_type" :localdata="op_type_options" />
                                    </uni-forms-item>
                                </uni-col>
                                <uni-col :sm="12">
                                    <uni-forms-item label="物料编码">
                                        <uni-easyinput v-model="search_form.material_no" trim />
                                    </uni-forms-item>
                                </uni-col>
                            </uni-row>
                            <uni-row :gutter="15">
                                <uni-col :sm="12">
                                    <uni-forms-item label="物料名称">
                                        <uni-easyinput v-model="search_form.material_name" trim />
                                    </uni-forms-item>
                                </uni-col>
                                <uni-col :sm="12">
                                    <uni-forms-item label="规格型号">
                                        <uni-easyinput v-model="search_form.material_spec" trim />
                                    </uni-forms-item>
                                </uni-col>
                            </uni-row>
                            <uni-row :gutter="15">
                                <uni-col :sm="12">
                                    <uni-forms-item label="单据编号">
                                        <uni-easyinput v-model="search_form.bill_no" trim />
                                    </uni-forms-item>
                                </uni-col>
                                <uni-col :sm="12">
                                    <uni-forms-item label="收货人">
                                        <uni-easyinput v-model="search_form.receiver" trim />
                                    </uni-forms-item>
                                </uni-col>
                            </uni-row>
                            <uni-row :gutter="15">
                                <uni-col :sm="12">
                                    <uni-forms-item label="状态">
                                        <uni-data-select v-model="search_form.status" :localdata="[{ value: 'failed', text: '失败' }]"></uni-data-select>
                                    </uni-forms-item>
                                </uni-col>
                            </uni-row>
                        </uni-forms>
                    </view>
                </uni-popup-dialog>
            </uni-popup>
        </template>
    </uni-section>
</template>

<script>
    import store from '@/store'
    import { breadcrumb_stockname, formatDate, truncate, link_to, play_audio_prompt } from '@/utils'
    import { InvPlan, InvLog } from '@/utils/model'
    
    export default {
        data() {
            return {
                inv_logs: [],
                total: 2000,
                page: 1,
                per_page: 20,
                // #ifdef H5
                    cc_list_height: 'calc(100vh - 187px)',
                // #endif
                // #ifdef APP-PLUS
                    cc_list_height: `calc(100vh - ${187 - store.state.system_info.statusBarHeight}px)`,
                // #endif
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
                op_type_dict: InvLog.FOpTypeEnum,
                goods_nav: {
                    options: [
                        { icon: 'search', text: '搜索' },
                        { icon: 'clear', text: '重置' },
                        { icon: 'info-filled', text: '失败' }
                    ],
                    button_group: [
                        { text: '重试失败日志', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                    ]
                }
            }
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
            breadcrumb_stockname,
            link_to,
            formatDate,
            truncate,
            debug() {
                this.$logger.info('>>> $data', this.$data)
            },
            change_page(e) {
                this.page = e.current
                this.load_inv_logs()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$refs.search_dialog.open()
                if (e.index === 1) this.reset_search_form()
                if (e.index === 2) {
                    this.search_form = { status: 'failed' }
                    this.search()
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.retry_all()
            },
            reset_search_form() {
                this.search_form = {}
                this.search()
            },
            search() {
                this.page = 1
                this.total = 100 * this.per_page
                this.load_inv_logs()
            },
            search_dialog_confirm() {
                this.search()
                this.$refs.search_dialog.close()
            },
            async load_inv_logs() {
                let options = { FStockId: store.state.cur_stock.FStockId }
                if (store.state.cur_area?.value) options['FStockLocId.FNumber_sw'] = store.state.cur_area.value // 考虑库区
                if (this.search_form.create_time_ge) options.FCreateTime_ge = this.search_form.create_time_ge
                if (this.search_form.create_time_le) options.FCreateTime_le = this.search_form.create_time_le
                if (this.search_form.op_type) options.FOpType = this.search_form.op_type
                if (this.search_form.material_no) options['FMaterialId.FNumber_lk'] = this.search_form.material_no
                if (this.search_form.material_name) options['FMaterialName_lk'] = this.search_form.material_name
                if (this.search_form.material_spec) options['FModel_lk'] = this.search_form.material_spec
                if (this.search_form.bill_no) options.FBillNo_lk = this.search_form.bill_no
                if (this.search_form.receiver) options.FReceiver_lk = this.search_form.receiver
                if (this.search_form.status == 'failed') options.FCInvId = ''
                let meta = { page: this.page, per_page: this.per_page, order: 'FID DESC' }
                uni.showLoading({ title: 'Loading' })
                this.total = await InvLog.count(options, meta)
                let res = await InvLog.query(options, meta)
                this.inv_logs = res.data
                uni.hideLoading()
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
                // this.search_form.status = 'failed'
                this.page = 1
                this.load_inv_logs()
            }
        }
    }
</script>

<style lang="scss" scoped>
    .cc-list-scroll {
        width: 100%;
        overflow-x: auto;
        height: calc(100vh - 187px);
    }
    .uni-table-tr::v-deep {
        .uni-table-td {
            padding: 4px 5px;
        }
    }
    .uni-group--card::v-deep {
        overflow: visible;
    }
    .uni-list::v-deep {
        .uni-list--border-bottom {
            display: none;
        }
    }
    .uni-forms::v-deep {
        .uni-forms-item {
            margin-bottom: 10px;
        }
    }
</style>
