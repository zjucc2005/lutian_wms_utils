<template>
    <uni-notice-bar single scrollable text="扫码单据获取物料明细后，下一步新增计划明细" />
    
    <uni-section title="查询单据编号" type="square"
        :sub-title="[
            $store.state.cur_stock['FUseOrgId.FName'],
            $store.state.cur_stock['FGroup.FName'] || '未分组',
            $store.state.cur_stock.FName
        ].join(' / ')">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入单据编号"
                focus
                prefix-icon="scan"
                @confirm="handle_search"
                @clear="handle_search"
                @icon-click="searchbar_icon_click"
                primary-color="rgb(238, 238, 238)"
                :styles="{
                    color: '#000',
                    backgroundColor: 'rgb(238, 238, 238)',
                    borderColor: 'rgb(238, 238, 238)'
                }"
            />
        </view>
    </uni-section>
    
    <uni-section title="入库物料明细" type="square"
        v-if="inbound_task.inbound_list?.length" 
        class="above-uni-goods-nav"
        >
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center" width="60">QR</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">仓库</uni-th>
                <uni-th align="center">供应商</uni-th>
                <uni-th align="center" width="80">交货数量</uni-th>
                <uni-th align="center" width="80">收料单位</uni-th>
                <uni-th align="center" width="100">已计划数量</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in inbound_task.inbound_list" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td align="center">
                    <uqrcode :canvas-id="`qrcode_${index}`" :value="obj.material_no" :size="40"></uqrcode>
                </uni-td>
                <uni-td>{{ obj.material_no }}</uni-td>
                <uni-td>{{ obj.material_name }}</uni-td>
                <uni-td>{{ obj.material_spec }}</uni-td>
                <uni-td><text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></uni-td>
                <uni-td>{{ obj.supplier_name }}</uni-td>
                <uni-td align="center">{{ obj.base_unit_qty }}</uni-td>
                <uni-td align="center">{{ obj.base_unit_name }}</uni-td>
                <uni-td align="center">{{ obj.planned_qty }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="生成标签" type="primary" @click="gen_label(obj, `qrcode_${index}`)"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item
                v-for="(obj, index) in inbound_task.inbound_list" :key="index"
                @click="gen_label(obj, `qrcode_${index}`)" clickable
                show-arrow
                >
                <template #header>
                    <view class="uni-list-item__head">
                        <uqrcode :canvas-id="`qrcode_${index}`" :value="obj.material_no" :size="40"></uqrcode>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj.material_no }}</text>
                        <view class="note">
                            <view>名称：{{ obj.material_name }}</view>
                            <view>规格：{{ obj.material_spec }}</view>
                            <view>仓库：<text :class="[obj.stock_id == $store.state.cur_stock.FStockId ? 'text-primary' : 'text-error']">{{ obj.stock_name }}</text></view>
                            <view>供应商：{{ obj.supplier_name }}</view>
                        </view>
                    </view>
                </template>
                <template v-slot:footer>
                    <view class="uni-list-item__foot">
                        <text>{{ obj.base_unit_qty }} {{ obj.base_unit_name }}</text>
                        <progress 
                            :percent="_calc_percentage(obj)" 
                            stroke-width="2"
                            :active-color="_calc_percentage(obj) == 100 ? '#4cd964' : '#f0ad4e'"
                        />
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <view class="uni-goods-nav-wrapper">
        <uni-goods-nav 
            :options="goods_nav.options" 
            :button-group="goods_nav.button_group"
            :fill="$store.state.goods_nav_fill"
            @click="goods_nav_click"
            @buttonClick="goods_nav_button_click"
        />
    </view>
    
    <cover-image 
        v-if="is_completed" 
        src="/static/icon/yiwancheng_stamp.png"
        class="cover-image">
    </cover-image>
</template>

<script>
    import store from '@/store'
    import K3CloudApi from '@/utils/k3cloudapi'
    import { play_audio_prompt, formatDate } from '@/utils'
    import { InboundTask, InvPlan, PurReceiveBill } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    // #ifdef H5
    import { gen_pdf_material_label } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                inbound_task: {},
                inv_plans: [],
                is_completed: false,
                search_form: {
                    bill_no: ''
                },
                goods_nav: {
                    options: [
                        { icon: 'cart', text: '计划', info: '' }
                    ],
                    button_group: [
                        {
                            text: '扫码查询单据',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        },
                        {
                            text: '新增计划明细',
                            backgroundColor: store.state.goods_nav_color.blue,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        onShow() {
            this.$nextTick(() => {
                this.handle_search()
            })
        },
        mounted() {
            this.inbound_task = new InboundTask()
        },
        methods: {
            gen_label(obj, canvas_id) {
                // #ifdef H5
                let options = {
                    no: obj.material_no, 
                    name: obj.material_name, 
                    spec: obj.material_spec, 
                    supplier_name: obj.supplier_name, 
                    inbound_time: formatDate(Date.now(), 'yyyy-MM-dd')
                }
                uni.canvasToTempFilePath({
                    canvasId: canvas_id,
                    success: function(res) { 
                        let url = gen_pdf_material_label({ qr: res.tempFilePath, ...options })
                        window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800,height=600') // 打开小窗口
                    }
                })
                // #endif
                // #ifdef APP-PLUS
                    uni.showToast({ icon: 'none', title: '仅PC端支持打印' })
                // #endif
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('this.$data', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
                if (e.index === 1) this.new_plan() // btn:新建
            },
            new_plan() {
                if (!this.search_form.bill_no) {
                    uni.showToast({ icon: 'none', title: '单据编号不能为空' })
                    return
                }
                if (this.inbound_task.inbound_list.length == 0) {
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                    return
                }
                if (this.is_completed) {
                    uni.showToast({ icon: 'none', title: '该计划已完成' })
                    return
                }
                uni.navigateTo({
                    url: '/pages/operation/inbound/v2/plan_new_cgsl',
                    success: (res) => {
                        play_audio_prompt('success')
                        res.eventChannel.emit('sendInboundTask', { inbound_task: this.inbound_task })
                    }
                })
            },
            planned_qty(material_id) {
                let res = 0
                for (let inv_plan of this.inv_plans) {
                    if (inv_plan.FMaterialId == material_id) {
                        res += inv_plan.FOpQTY
                    }
                }
                return res
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            async handle_search() {
                this.is_completed = false
                this.inbound_task = new InboundTask()
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'CGSL' + this.search_form.bill_no // 自动补充前缀
                    }
                    await this.load_bill()
                    await this.load_inv_plans()
                } else {
                    this.after_load_inv_plans()
                }
            },
            async load_bill() {
                let bill_no = this.search_form.bill_no
                if (bill_no.startsWith('CGSL')) { // 直接调拨单
                    uni.showLoading({ title: 'Loading' })
                    let res = await PurReceiveBill.view(bill_no)
                    uni.hideLoading()
                    this.after_load_bill(res)
                } else {
                    this.inbound_task = new InboundTask()
                    uni.showToast({ icon: 'none', title: '未找到单据信息' })
                }
            },
            async load_inv_plans() {
                let bill_no = this.search_form.bill_no
                if (bill_no.startsWith('CGSL')) {
                    return InvPlan.query({
                        FStockId: store.state.cur_stock.FStockId,
                        FBillNo: bill_no,
                        FOpType: 'in',
                    }, {}).then(res => { 
                        this.inv_plans = res.data
                        this.after_load_inv_plans(res.data)
                    })
                } else {
                    this.inv_plans = []
                }
            },
            after_load_bill(response) {
                if (response.data.Result.ResponseStatus.IsSuccess) {
                    let data = response.data.Result.Result
                    let inbound_list = []
                    for (let obj of data.PUR_ReceiveEntry) {
                        let inbound_obj = inbound_list.find(x => x.material_id == obj.MaterialID_Id)
                        if (inbound_obj) {
                            inbound_obj.base_unit_qty += obj.ActReceiveQty // 合并相同物料ID
                        } else {
                            inbound_list.push({
                                material_id: obj.MaterialID_Id, // 物料编码，采用调入仓库对应的ID
                                material_no: obj.MaterialID.Number,
                                material_name: obj.MaterialID.Name[0]?.Value,
                                material_spec: obj.MaterialID.Specification[0]?.Value,
                                base_unit_qty: obj.ActReceiveQty,
                                base_unit_name: obj.UnitId.Name[0]?.Value,
                                base_unit_no: obj.UnitId.Number,
                                supplier_id: obj.OwnerId_Id,
                                supplier_no: obj.OwnerId.Number,
                                supplier_name: obj.OwnerId.Name[0]?.Value,
                                stock_id: obj.StockID_Id,
                                stock_no: obj.StockID.Number,
                                stock_name: obj.StockID.Name[0]?.Value,
                                batch_no: formatDate(Date.now(), 'yyyyMMdd'), // 入库时间作为批次号
                                planned_qty: 0
                            })
                        }
                    }
                    this.inbound_task.category = 'cgsl'
                    this.inbound_task.bill_no = data.BillNo
                    this.inbound_task.stock_id = store.state.cur_stock.FStockId
                    this.inbound_task.stock_name = store.state.cur_stock.FName
                    this.inbound_task.staff_no = store.state.cur_staff.FNumber
                    this.inbound_task.inbound_list = inbound_list
                } else {
                    this.inbound_task = new InboundTask()
                    uni.showToast({ icon: 'none', title: response.data.Result.ResponseStatus.Errors[0]?.Message })
                }
            },
            after_load_inv_plans(inv_plans=[]) {
                if (this.inbound_task.inbound_list.length == 0) {
                    this.goods_nav.options[0].info = ''
                    this.is_completed = false
                    return
                }
                let inbound_qty = 0  // 待入库数量
                let plan_qty = 0  // 已计划数量
                let complete_qty = 0 // 已入库数量
                for (let obj of this.inbound_task.inbound_list) {
                    inbound_qty += obj.base_unit_qty
                    obj.planned_qty = this.planned_qty(obj.material_id)
                }
                for (let inv_plan of inv_plans) {
                    plan_qty += inv_plan.FOpQTY
                    if (plan_qty.FDocumentStatu == 'C') complete_qty += inv_plan.FOpQTY
                }
                let plan_percentage = Math.floor(plan_qty / inbound_qty * 100)
                this.goods_nav.options[0].info = `${plan_percentage}%`
                this.is_completed = inbound_qty == complete_qty
            },
            _calc_percentage(obj) {
                return (obj.planned_qty / obj.base_unit_qty) * 100
            }
        }
    }
</script>

<style lang="scss">
    .cover-image {
        position: absolute;
        top: 80px;
        right: 50px;
        width: 128px;
        height: 128px;
    }
</style>
