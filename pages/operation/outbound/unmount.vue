<template>
    <view>
        <uni-section
            title="下架" type="line"
            :sub-title="unmount_form.material_name ? [unmount_form.material_name, unmount_form.material_spec].join('\n') : ['-', '-'].join('\n')">
            <view class="container">
                <uni-forms ref="unmount_form" :model="unmount_form" :rules="unmount_form_rules" labelWidth="80px">
                    <uni-forms-item label="物料编号" name="material_no">
                        <uni-easyinput 
                            v-model="unmount_form.material_no"
                            trim="both"
                            @change="handle_material_no_change"
                            @clear="handle_material_no_change"
                        />
                    </uni-forms-item>
                    <uni-forms-item label="库位号" name="loc_no">
                        <uni-easyinput v-model="unmount_form.loc_no" trim="both" />
                    </uni-forms-item>
                    <uni-forms-item label="下架数量" name="op_qty">
                        <uni-easyinput v-model="unmount_form.op_qty" type="number">
                            <template #right>
                                <text class="easyinput-suffix-text">{{ unmount_form.base_unit_name }}</text>
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
                    :right-options="inv_log.FOpType == 'out' && !inv_log.status ? log_options : []"
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
    import { Inv, InvLog, StockLoc } from '@/utils/model';
    import { is_material_no_format, is_loc_no_std_format, is_decimal_unit, describe_inv_log } from '@/utils';
    import { formatDate } from '@/uni_modules/uni-dateformat/components/uni-dateformat/date-format.js'
    // #ifdef APP-PLUS
    const myScanCode = uni.requireNativePlugin('My-ScanCode')
    // #endif
    export default {
        data() {
            return {
                cur_stock: {},
                cur_staff: {},
                cur_outbound_task: {},
                invs: [],
                inv_logs: [],
                stock_locs: [],
                bd_materials: [], // 物料基础数据Array，cache
                unmount_form: {
                    material_no: '',
                    material_name: '',
                    material_spec: '',
                    loc_no: '',
                    op_qty: '',
                    base_unit: 'Pcs',
                    base_unit_name: 'Pcs',
                    decimal_unit: false
                },
                unmount_form_rules: {
                    material_no: {
                        rules: [
                            { required: true, errorMessage: '物料编号不能为空'},
                            {
                                validateFunction: (rule, value, data, callback) => {
                                    let material_no = value
                                    let use_org_id = this.cur_stock.FUseOrgId
                                    let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                                    if (!bd_material) {
                                        return get_bd_material(material_no, use_org_id).then(res => {
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
                            { required: true, errorMessage: '下架数量不能为空' },
                            { format: 'number', errorMessage: '下架数量只能输入数字' },
                            { 
                                validateFunction: (rule, value, data, callback) => {
                                    if (value <= 0) return callback('下架数量必须大于0')
                                    if (!this.unmount_form.decimal_unit && !Number.isInteger(value)) {        
                                        return callback('下架数量必须为整数')
                                    }
                                    return Inv.query({
                                        FStockId: this.cur_stock.FStockId,
                                        'FMaterialId.FNumber': this.unmount_form.material_no,
                                        'FStockLocId.FNumber': this.unmount_form.loc_no, 
                                        FQty_gt: 0 }, { order: 'FBatchNo ASC' },
                                    ).then(res => {
                                        this.invs = res.data
                                        let sum_qty = 0
                                        res.data.forEach(inv => sum_qty += inv.FQty)
                                        if (sum_qty < value) {
                                            return callback('此库位号库存数量不足')
                                        }
                                    })
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
                            text: '提交下架',
                            backgroundColor: 'linear-gradient(90deg, #1E83FF, #0053B8)',
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        mounted() {
            this.cur_stock = store.state.cur_stock // 加载当前仓库
            this.cur_staff = store.state.cur_staff // 加载当前员工
            this.cur_outbound_task = uni.getStorageSync('cur_outbound_task')
            InvLog.query(
                { FStockId: this.cur_stock.FStockId, FBillNo: this.cur_outbound_task.bill_no, FOpType_in: ['out', 'out_cl'] }, 
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
            goods_nav_click(e) {
                if (e.index === 0) this.more_actions() // btn:更多  
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码
                if (e.index === 1) this.submit_unmount() // btn:提交下架
            },
            swipe_action_click(e, inv_log_id) {
                console.log('swipe_action_click e:', e, inv_log_id)
                if (e.index === 0) this.cancel_unmount(inv_log_id) // 取消操作
            },
            // >>> action
            more_actions(){
                uni.showActionSheet({
                    itemList: ['出库详情', '操作日志'],
                    success: (e) => {
                        if (e.tapIndex === 0) uni.navigateTo({ url: '/pages/operation/outbound/task' })
                        if (e.tapIndex === 1) uni.navigateTo({ url: '/pages/operation/outbound/logs' })
                    }
                })
            },
            scan_code() {
                // #ifdef APP-PLUS
                myScanCode.scanCode({}, (res) => {
                    console.log('myScanCode res:', res)
                    if (res.success == 'true') this.handle_scan_code(res.result)
                })
                // #endif               
                // #ifndef APP-PLUS
                uni.scanCode({
                    success: (res) => {
                        console.log("uni.scanCode res:", res)
                        this.handle_scan_code(res.result)
                    }
                });
                // #endif
            },
            handle_scan_code(text) {
                if (is_material_no_format(text)) {
                    this.unmount_form.material_no = text
                    this.handle_material_no_change()
                } else if (is_loc_no_std_format(text)) {
                    this.unmount_form.loc_no = text
                } else {
                    if(!this.unmount_form.material_no) {
                        this.unmount_form.material_no = text
                        this.handle_material_no_change()
                    } else if (!this.unmount_form.loc_no) {
                        this.unmount_form.loc_no = text
                    }
                }
            },
            submit_unmount() {
                this.$refs.unmount_form.validate().then(e => {
                    console.log('submit unmount e:', e)
                    this.auto_allocate()
                    async 
                    this.invs.filter(inv => inv.checked).forEach(inv => {
                        let inv_log = new InvLog({
                            FOpType: 'out',
                            FStockId: inv.FStockId,
                            FStockLocNo: inv['FStockLocId.FNumber'],
                            FMaterialId: inv.FMaterialId,
                            FOpQTY: inv.checked_qty,
                            FBatchNo: inv.FBatchNo,
                            FBillNo: this.cur_outbound_task.bill_no,
                            FOpStaffNo: this.cur_staff.FNumber
                        })
                        inv_log.save().then(save_res => {
                            this.after_save(save_res) // 处理返回日志                         
                            this.reset_form() // 重置表单
                        })
                    })
                }).catch(err => {
                    console.log('submit unmount err:', err);
                })
            },
            cancel_unmount(inv_log_id) {
                let inv_log = this.inv_logs.find(x => x.FID === inv_log_id)
                if (inv_log.FOpType == 'out' && !inv_log.status) {
                    let new_inv_log = new InvLog({
                        FOpType: 'out_cl',
                        FStockId: inv_log.FStockId,
                        FStockLocNo: inv_log['FStockLocId.FNumber'],
                        FMaterialId: inv_log.FMaterialId,
                        FOpQTY: inv_log.FOpQTY,
                        FBatchNo: inv_log.FBatchNo,
                        FBillNo: inv_log.FBillNo,
                        FOpStaffNo: this.cur_staff.FNumber,
                        FReferId: inv_log.FID
                    })
                    new_inv_log.save().then(save_res => {
                        this.after_save(save_res)
                        this.$refs.inv_log_swipe.closeAll() // 关闭滑动操作
                    })
                } else {
                    uni.showToast({ icon: 'error', title: 'ERROR' })
                }
            },
            handle_material_no_change() {
                let material_no = this.unmount_form.material_no
                if (!material_no) {
                    this.set_base_unit()
                    return
                }
                let use_org_id = this.cur_stock.FUseOrgId
                let bd_material = this.bd_materials.find(x => x.FNumber == material_no)
                if (bd_material) {
                    this.set_base_unit(bd_material)
                } else {
                    get_bd_material(material_no, use_org_id).then(res => {
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
            // function
            set_base_unit(bd_material) {
                if (bd_material) {
                    this.unmount_form.material_name = bd_material.FName
                    this.unmount_form.material_spec = bd_material.FSpecification
                    this.unmount_form.base_unit = bd_material['FBaseUnitId.FNumber']
                    this.unmount_form.base_unit_name = bd_material['FBaseUnitId.FName']
                    this.unmount_form.decimal_unit = is_decimal_unit(bd_material['FBaseUnitId.FName'])
                } else {
                    this.unmount_form.material_name = ''
                    this.unmount_form.material_spec = ''
                    this.unmount_form.base_unit = 'Pcs'
                    this.unmount_form.base_unit_name = 'Pcs'
                    this.unmount_form.decimal_unit = false
                }
            },
            reset_form() {
                this.unmount_form = {
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
            // 提交or取消下架后，获取新增日志并插入下方日志列表中
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
            // 日志逐条插入列表中，判断是否取消
            unshift_inv_log(c_inv_log) {
                if (c_inv_log.FOpType == 'out_cl') {
                    let refer_inv_log = this.inv_logs.find(x => x.FID === c_inv_log.FReferId )
                    if (refer_inv_log) refer_inv_log.status = '已取消'
                }
                this.inv_logs.unshift(c_inv_log)
                if (this.inv_logs.length > 5) this.inv_logs = this.inv_logs.slice(0, 5)  // 保留有限条最新日志
            },
            auto_allocate() {
                // 自动分配下架库存，根据批次号先入先出
                let op_qty = this.unmount_form.op_qty
                let sum_checked_qty = 0
                this.invs.forEach(inv => {
                    if (sum_checked_qty < op_qty) {
                        let checking_qty = Math.min(inv.FQty, op_qty - sum_checked_qty)
                        inv.checked = true
                        inv.checked_qty = checking_qty
                        sum_checked_qty += checking_qty
                    }
                })
                console.log('auto_allocate res', this.invs.filter(inv => inv.checked))
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
