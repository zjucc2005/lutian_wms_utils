<template>
    <view>
        <uni-section
            title="上架" type="line"
            :sub-title="mount_form.material_name ? [mount_form.material_name, mount_form.material_spec].join('\n') : ['-', '-'].join('\n')">
            <view class="container">
                <uni-forms ref="mount_form" :model="mount_form" :rules="mount_form_rules" labelWidth="80px">
                    <uni-forms-item label="物料编号" name="material_no">
                        <uni-easyinput 
                            v-model="mount_form.material_no"
                            trim="both"
                            @change="handle_material_no_change"
                            @clear="handle_material_no_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="库位号" name="loc_no">
                        <uni-easyinput v-model="mount_form.loc_no" trim="both" />
                    </uni-forms-item>
                    <uni-forms-item label="上架数量" name="op_qty">
                        <uni-easyinput v-model="mount_form.op_qty" type="number">
                            <template #right>
                                <text class="easyinput-suffix-text">{{ mount_form.base_unit_name }}</text>
                            </template>
                        </uni-easyinput>
                    </uni-forms-item>
                </uni-forms>
            </view>
        </uni-section>
        <uni-section title="最近操作日志" type="line" style="padding-bottom: 60px;">
            <uni-swipe-action ref="inv_log_swipe">
                <uni-swipe-action-item
                    v-for="(inv_log, index) in inv_logs"
                    :key="index"
                    :threshold="60"
                    :right-options="inv_log.FOpType == 'in' && !inv_log.status ? log_options : []"
                    @click="swipe_action_click($event, inv_log.FID)"
                >
                    <uni-list-item 
                        :title="formatDate(inv_log.FCreateTime, 'yyyy-MM-dd hh:mm:ss')"
                        :note="describe_inv_log(inv_log)"
                        :rightText="inv_log.status">
                        <template v-slot:footer>
                            <text class="uni-list-item-right-text">{{ inv_log.status }}</text>
                        </template>
                    </uni-list-item>
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
        
        <view class="uni-goods-nav-wrapper">
            <uni-goods-nav 
                :options="goods_nav.options" 
                :button-group="goods_nav.button_group"
                @click="goods_nav_click"
                @buttonClick="goods_nav_button_click"
            />
        </view>
    </view>
</template>

<script>
    import store from '@/store';
    import { get_bd_material } from '@/utils/api';
    import { InvLog, StockLoc } from '@/utils/model';
    import { is_material_no_format, is_loc_no_std_format, is_decimal_unit, describe_inv_log } from '@/utils';
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_inbound_task: {},
                inv_logs: [],
                stock_locs: [],
                bd_materials: [], // 物料基础数据Array，cache
                mount_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    loc_no: '',
                    op_qty: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                },              
                mount_form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let material_no = value
                                    let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                                    if (!bd_material) {
                                        return get_bd_material(material_no, this.cur_stock.FUseOrgId).then(res => {
                                            if (res.data[0]) {
                                                bd_material = res.data[0]
                                                if (!this.bd_materials.some(x => x.FNumber == material_no)) {
                                                    this.bd_materials.push(res.data[0])
                                                }
                                                if (bd_material.FDocumentStatus != 'C') {
                                                    return callback('此物料编码未审核')
                                                } else if (bd_material.FForbidStatus != 'A'){
                                                    return callback('此物料编码被禁用')
                                                }
                                                return bd_material
                                            } else {
                                                return callback('不存在此物料编码')
                                            }
                                        })
                                    } else {
                                        if (bd_material.FDocumentStatus != 'C') {
                                            return callback('此物料编码未审核')
                                        } else if (bd_material.FForbidStatus != 'A'){
                                            return callback('此物料编码被禁用')
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    loc_no: {
                        rules: [
                            { required: true, errorMessage: '库位号不能为空' },
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let stock_loc = this.stock_locs.find(x => x.FNumber == value)
                                    if (!stock_loc) {
                                        return callback('不存在此库位号')
                                    } else if (stock_loc.FDocumentStatus != 'C') {
                                        return callback('此库位号未审核')
                                    }
                                }
                            }
                        ]
                    },
                    op_qty: {
                        rules: [
                            { required: true, errorMessage: '上架数量不能为空' },
                            { format: 'number', errorMessage: '上架数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('上架数量必须大于0')
                                    if (!this.mount_form.decimal_unit && !Number.isInteger(value)) {
                                        return callback('上架数量必须为整数')
                                    }
                                }
                            }
                        ]
                    }
                },
                log_options: [
                    {
                        text: '取消',
                        style: {
                            backgroundColor: '#f56c6c'
                        }
                    }
                ],
                goods_nav: {
                    options: [
                        { icon: 'more-filled', text: '更多' }
                    ],
                    button_group: [
                        {
                            text: '扫码',
                            backgroundColor: 'linear-gradient(90deg, #FE6035, #EF1224)',
                            color: '#fff'
                        },
                        {
                            text: '提交上架',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock
            this.cur_staff = store.state.cur_staff
            this.cur_inbound_task = uni.getStorageSync('cur_inbound_task')
            InvLog.query(
                { FStockId: this.cur_stock.FStockId, FBatchNo: this.cur_inbound_task.batch_no, FOpType_in: ['in', 'in_cl'] }, 
                { page: 1, per_page: 5, order: 'FCreateTime DESC' }).then(res => {
                res.data.reverse().forEach(log => this.unshift_inv_log(log))
            })
            StockLoc.query({ FStockId: this.cur_stock.FStockId }).then(res => {
                this.stock_locs = res.data // 加载当前仓库的库位数据
            })
        },
        methods: {
            // >>> import
            describe_inv_log,
            formatDate,
            // >>> component
            swipe_action_click(e, inv_log_id) {
               if (e.index === 0) this.submit_cancel(inv_log_id) // btn:取消
            },
            goods_nav_click(e) {
                if (e.index === 0) this.more_actions() // btn:更多
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.submit_mount() // btn:提交上架
            },
            // >>> action
            handle_material_no_change() {
                // console.log('handle_material_no_change e:', e)
                let material_no = this.mount_form.material_no
                if (!material_no) {
                    this.set_base_unit()
                    return
                }
                let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                if (bd_material) {
                    this.set_base_unit(bd_material)
                } else {
                    get_bd_material(material_no, this.cur_stock.FUseOrgId).then(res => {
                        if (res.data[0]) {
                            bd_material = res.data[0]
                            if (!this.bd_materials.some(x => x.FNumber == material_no)) {
                                this.bd_materials.push(res.data[0])
                            }
                            this.set_base_unit(bd_material)
                        } else {
                            this.set_base_unit()
                        }
                    })
                }
            },
            more_actions() {
                uni.showActionSheet({
                    itemList: ['入库详情', '操作日志'],
                    success: (e) => {
                        console.log('showActionSheet e:', e)
                        if (e.tapIndex === 0) uni.navigateTo({ url: '/pages/operation/inbound/task' })
                        if (e.tapIndex === 1) uni.navigateTo({ url: '/pages/operation/inbound/logs' })
                    }
                })
            },
            scan_code() {
                uni.scanCode({
                    success: (res) => {
                         console.log("uni.scanCode res:", res)
                        if (is_material_no_format(res.result)) {
                            this.mount_form.material_no = res.result
                            this.handle_material_no_change()
                        } else if (is_loc_no_std_format(res.result)) {
                            this.mount_form.loc_no = res.result
                        } else {
                            if(!this.mount_form.material_no) {
                                this.mount_form.material_no = res.result
                                this.handle_material_no_change()
                            } else if (!this.mount_form.loc_no) {
                                this.mount_form.loc_no = res.result
                            }
                        }
                    }
                })
            },
            submit_mount() {
                this.$refs.mount_form.validate().then(e => {
                    let bd_material = this.bd_materials.find(x => x.FNumber == this.mount_form.material_no)
                    let stock_loc = this.stock_locs.find(x => x.FNumber == this.mount_form.loc_no)
                    let inv_log = new InvLog({
                        FOpType: 'in',
                        FStockId: this.cur_stock.FStockId,
                        FStockLocNo: stock_loc.FNumber,
                        FMaterialId: bd_material.FMaterialId,
                        FOpQTY: this.mount_form.op_qty * 1,
                        FBatchNo: this.cur_inbound_task.batch_no,
                        FBillNo: this.cur_inbound_task.bill_no,
                        FOpStaffNo: this.cur_staff.FNumber
                    })
                    inv_log.save().then(save_res => {
                        this.after_save(save_res)
                        this.reset_form() // 重置表单
                    })
                }).catch(err => {
                    console.log('submit mount err:', err);
                })
            },
            submit_cancel(inv_log_id) {
                let inv_log = this.inv_logs.find(x => x.FID === inv_log_id)
                if (inv_log.FOpType == 'in' && !inv_log.status) {
                    let inv_log = new InvLog({
                        FOpType: 'in_cl',
                        FStockId: inv_log.FStockId,
                        FStockLocNo: inv_log['FStockLocId.FNumber'],
                        FMaterialId: inv_log.FMaterialId,
                        FOpQTY: inv_log.FOpQTY,
                        FBatchNo: inv_log.FBatchNo,
                        FBillNo: inv_log.FBillNo,
                        FOpStaffNo: this.cur_staff.FNumber,
                        FReferId: inv_log.FID                   
                    })
                    inv_log.save().then(save_res => {
                        this.after_save(save_res)
                        this.$refs.inv_log_swipe.closeAll() // 关闭滑动操作
                    })
                } else {
                    uni.showToast({ icon: 'error', title: 'ERROR' })
                }
            },
            // >>> function
            set_base_unit(bd_material) {
                if (bd_material) {
                    this.mount_form.material_name = bd_material.FName
                    this.mount_form.material_spec = bd_material.FSpecification
                    this.mount_form.base_unit = bd_material['FBaseUnitId.FNumber']
                    this.mount_form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.mount_form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                } else {
                    this.mount_form.material_name = ''
                    this.mount_form.material_spec = ''
                    this.mount_form.base_unit = 'Pcs'
                    this.mount_form.base_unit_name = 'Pcs'
                    this.mount_form.decimal_unit = false
                }
            },
            // 提交上架or取消上架后，获取新增日志并插入下方日志列表中
            after_save(save_res) {
                if (save_res.data.Result.ResponseStatus.IsSuccess) {
                    InvLog.find(save_res.data.Result.Id).then(find_res => {
                        if (find_res.data[0]) {
                            this.unshift_inv_log(find_res.data[0])
                            uni.showToast({ title: '提交成功' })                           
                        } 
                    })
                } else {
                    uni.showToast({ title: '提交失败' })
                }
            },
            reset_form() {
                this.mount_form = {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    loc_no: '',
                    op_qty: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                }
                uni.pageScrollTo({ scrollTop: 0 })
            },
            // 日志逐条插入列表中，判断是否取消
            unshift_inv_log(inv_log) {
                if (inv_log.FOpType == 'in_cl') {
                    let refer_inv_log = this.inv_logs.find(x => x.FID === inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.inv_logs.unshift(inv_log)
                if (this.inv_logs.length > 5) this.inv_logs = this.inv_logs.slice(0, 5) // 保留有限条最新日志
            }
        }
    }
</script>

<style>
    .easyinput-suffix-text {
        color: #666;
        padding: 0 10px;
    }
    .uni-list-item-right-text {
        color: #dd524d;
        font-size: 12px;
        display: flex;
        align-items: center;
    }
</style>
