<template>
    <canvas ref="qrcode" id="qrcode" canvas-id="qrcode" style="position: absolute; visibility: hidden; width: 400px; height: 400px;"></canvas>
    <uni-section title="查询生产发料通知单编号" type="square" @click="debug">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" trim
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                @confirm="search"
                @clear="search"
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
    
    <uni-section v-if="bill.bill_no" title="生产投料汇总（分库位）" type="square" class="above-uni-goods-nav">
        <uni-list>
            <uni-row>
                <uni-col :sm="8">
                    <uni-list-item title="单据编码" :right-text="bill.bill_no" />
                </uni-col>
                <uni-col :sm="8">
                    <uni-list-item title="领料部门" :right-text="bill.prd_line" />
                </uni-col>
                <uni-col :sm="8">
                    <uni-list-item title="时间" :right-text="bill.plan_start_date" />
                </uni-col>
            </uni-row>
        </uni-list>
        <uni-forms ref="storekeeper_opts_form" class="searchbar-container">
            <uni-row>
                <uni-col :sm="8">
                    <uni-forms-item label="仓管员">
                        <uni-data-select v-model="storekeeper" :localdata="storekeeper_opts" @change="storekeeper_change" />
                    </uni-forms-item>
                </uni-col>
            </uni-row>
        </uni-forms>
        
        <uni-table ref="table" border stripe class="table-sm">
            <uni-tr>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" width="50">单位</uni-th>
                <uni-th align="center" width="78">计划发料数量</uni-th>
                <uni-th align="center" width="78">已发料数量</uni-th>
                <uni-th align="center" width="106">仓库</uni-th>
                <uni-th align="center" width="230">WMS库位</uni-th>
                <uni-th align="center" width="78">WMS库存数量</uni-th>
                <uni-th align="center" width="78">金蝶即时库存</uni-th>
                <uni-th align="center" width="64">仓管员</uni-th>
            </uni-tr>
            <uni-tr v-for="(obj, index) in bill_entry_filtered" :key="index">
                <uni-td align="center">{{ obj.material_no }}</uni-td>
                <uni-td align="center">{{ obj.material_name }}</uni-td>
                <uni-td align="center">{{ obj.material_spec }}</uni-td>
                <uni-td align="center">{{ obj.unit }}</uni-td>
                <uni-td align="center">{{ obj.must_qty }}</uni-td>
                <uni-td align="center">{{ obj.picked_qty }}</uni-td>
                <uni-td align="center">{{ obj.stock_name }}</uni-td>
                <uni-td align="center">{{ obj.loc_memo }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">{{ obj.stk_qty }}</uni-td>
                <uni-td align="center">{{ obj.storekeeper }}</uni-td>
            </uni-tr>
        </uni-table>
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
</template>

<script>
    import store from '@/store'
    import { PrdIssueMtrNotice, StkInventory, Inv } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
    // #ifdef H5
    import { gen_pdf_prd_issue_mtrl } from '@/gen_pdf'
    // #endif
    
    export default {
        data() {
            return {
                // bill: { bill_no, org_id, prd_line, plan_start_date, entry[] }
                // entry: [{ material_no, material_name, material_spec, unit, must_qty, picked_qty, stock_id, stock_name, loc_nos[], qty, stk_qty, storekeeper }] }
                bill: {},
                search_form: {
                    // bill_no: 'SCFLTZD36879',
                    // bill_no: 'SCFLTZD36886'
                },
                storekeeper: '',
                storekeeper_opts: [],
                stk_inv: {}, // 即时库存信息 { stock_id: { material_no: qty } }
                pdf_data: {},
                goods_nav: {
                    options: [
                        { icon: 'clear', text: '重置' },
                    ],
                    button_group: [
                        { text: '扫码查询', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '生成PDF', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        mounted() {
            // this.handle_search()
        },
        computed: {
            bill_entry_filtered() {
                if (!this.storekeeper) return this.bill.entry
                if (this.storekeeper == 'null') return this.bill.entry.filter(x => x.storekeeper == null)
                return this.bill.entry.filter(x => x.storekeeper == this.storekeeper)
            }
        },
        methods: {
            debug() {
                this.$logger.info('>>>', this.$data)
                // console.log('>>> inv', this.bill.entry.filter(x => x.qty > 0))
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.reset_search_form()
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询
                if (e.index === 1) this.gen_pdf()   // btn:生成PDF
            },
            reset_search_form() {
                this.search_form = {}
                this.bill = {}
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            storekeeper_change() {
                
            },
            gen_loc_memo(list) {
                let set = new Set()
                for (let item of list) {
                    set.add(item.loc_no.slice(item.loc_no.indexOf('-') + 1))
                }
                // res.sort((x, y) => x > y ? 1 : -1)
                return Array.from(set).join(',')
            },
            async gen_pdf() {
                // #ifdef H5
                    if (!this.bill.bill_no) return
                    this.bill._qr = await this.gen_qrcode(this.bill.bill_no)
                    let pdf_data = this.gen_pdf_data()
                    // console.log('>>> pdf_data', pdf_data)
                    // return
                    let url = gen_pdf_prd_issue_mtrl(pdf_data)
                    window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800,height=600') // 打开小窗口
                // #endif
                // #ifdef APP-PLUS
                    uni.showModal({ title: '提示', content: '仅PC端支持打印' })
                // #endif
            },
            gen_pdf_data() {
                // 根据仓管员分组
                // { bill_no, prd_line, plan_start_date, _qr, group: { storekeeper: [] } }
                let res = { bill_no: this.bill.bill_no, prd_line: this.bill.prd_line, plan_start_date: this.bill.plan_start_date, _qr: this.bill._qr }
                let group = {}
                for (let obj of this.bill.entry || []) {
                    let sk = obj.storekeeper || 'null'
                    if (!group[sk]) group[sk] = []
                    group[sk].push(obj)
                }
                res.group = group
                return res
            },
            async gen_qrcode(text) {
                return new Promise((resolve, reject) => {
                    let uqr = new UQRCode();
                    uqr.data = text;
                    uqr.size = 400;
                    uqr.make();
                    var canvasContext = uni.createCanvasContext('qrcode', this); // 如果是组件，this必须传入
                    uqr.canvasContext = canvasContext;
                    uqr.drawCanvas();
                    uni.canvasToTempFilePath({
                        canvasId: 'qrcode',
                        success: res => {
                            resolve(res.tempFilePath)
                        }
                    })
                })
            },
            async search() {
                try {
                    if (!this.search_form.bill_no) return
                    // init
                    this.bill = { bill_no: this.search_form.bill_no, entry: [] }
                    // load
                    uni.showLoading({ title: '加载单据信息' })
                    await this.load_bill_head()
                    await this.load_bill_body()
                    uni.showLoading({ title: '加载库存信息' })
                    await this.load_stk_inv_info() // 实时
                    // await this.load_stk_inv_info_ss() // 快照
                    await this.load_inv_info()
                    uni.hideLoading()
                } catch (err) {
                    this.$logger.info('err', err)
                }
            },
            async load_bill_head() {
                let options = { FBillNo: this.search_form.bill_no }
                let meta = {
                    fields: ['FPrdOrgId', 'F_PAEZ_Base.FName', 'FPlanStartDate']
                }
                let res = await PrdIssueMtrNotice.query(options, meta)
                if (res.data.length) {
                    this.bill.org_id = res.data[0]['FPrdOrgId']
                    this.bill.prd_line = res.data[0]['F_PAEZ_Base.FName']
                    this.bill.plan_start_date = res.data[0]['FPlanStartDate']?.split('T')?.[0]
                }
            },
            async load_bill_body() {
                let options = { FBillNo: this.search_form.bill_no }
                let meta = {
                    fields: ['FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification', 'FMaterialId.F_PAEZ_Base1',
                             'FUnitId1.FName', 'FMustQty', 'FActPickedQty', 'FStockId', 'FStockId.FName']
                }
                let res = await PrdIssueMtrNotice.query(options, meta)
                let entry = []
                let storekeeper_opts = new Set()
                for (let d of res.data) {
                    let obj = entry.find(x => x.material_no == d['FMaterialId.FNumber'])
                    if (obj) {
                        obj.must_qty += d['FMustQty']
                        obj.picked_qty += d['FActPickedQty']
                    } else {
                        entry.push({
                            material_no: d['FMaterialId.FNumber'],
                            material_name: d['FMaterialId.FName'],
                            material_spec: d['FMaterialId.FSpecification'],
                            storekeeper: d['FMaterialId.F_PAEZ_Base1'],
                            unit: d['FUnitId1.FName'],
                            must_qty: d['FMustQty'],
                            picked_qty: d['FActPickedQty'],
                            // 仓库
                            // stock_list: [
                            //     {
                            //         stock_id: d['FStockId'],
                            //         stock_name: d['FStockId.FName'],
                            //         qty: 0,
                            //         invs: [],
                            //         loc_memo: '', // 展示用库位描述
                            //         stk_qty: 0
                            //     }
                            // ],
                            stock_id: d['FStockId'],
                            stock_name: d['FStockId.FName'],
                            qty: 0,
                            invs: [],
                            loc_memo: '', // 展示用库位描述
                            stk_qty: 0
                        })
                        storekeeper_opts.add(d['FMaterialId.F_PAEZ_Base1'] || 'null')
                    }
                }
                entry.sort((x, y) => x.material_no > y.material_no ? 1 : -1)
                this.bill.entry = entry
                this.storekeeper_opts = Array.from(storekeeper_opts).map(x => { return { value: x, text: x } })
            },
            async load_inv_info() {
                // 按仓库分组
                let stock = {}
                let inv = {}
                for (let obj of this.bill.entry) {
                    stock[obj.stock_id] ||= []
                    stock[obj.stock_id].push(obj.material_no)
                }
                let step = 50 // 分批查询
                for (let stock_id in stock) {
                    let inv_info = {} // { material_no: { sum_qty, list: [ { loc_no, batch_no, qty }] } }
                    let options = { FStockId: stock_id, FQty_gt: 0 }
                    let meta = { fields: ['FMaterialId.FNumber', 'FQty', 'FStockLocId.FNumber', 'FBatchNo'], return: 'array' }
                    for (let i = 0; i < stock[stock_id].length; i += step) {
                        let material_nos = stock[stock_id].slice(i, i + step)
                        let res = await Inv.query({ ...options, 'FMaterialId.FNumber_in': material_nos }, meta)
                        for (let d of res.data) {
                            if (!inv_info[d[0]]) inv_info[d[0]] = { qty: 0, list: [] }
                            inv_info[d[0]].qty += d[1]
                            inv_info[d[0]].list.push({ qty: d[1], loc_no: d[2], batch_no: d[3] })
                        }
                    }
                    inv[stock_id] = inv_info
                }
                for (let obj of this.bill.entry) {
                    let inv_info = inv?.[obj.stock_id]?.[obj.material_no]
                    if (inv_info) {
                        inv_info.list.sort((x, y) => x.loc_no > y.loc_no ? 1 : -1) // 分配策略，按库位号排序
                        obj.qty = inv_info.qty
                        obj.invs = inv_info.list
                        obj.loc_memo = this.gen_loc_memo(inv_info.list)
                    }
                }
            },
            // 即时库存 - 实时
            async load_stk_inv_info() {
                let stk_inv = {} // 即时库存信息 { stock_id: { material_no: qty } }
                for (let obj of this.bill.entry) {
                    // console.log('>>>', obj)
                    if (stk_inv[obj.stock_id]) continue
                    let inv_info = {}
                    let options = { FStockId: obj.stock_id, FBaseQty_gt: 0 }
                    let meta = { fields: ['FMaterialId.FNumber', 'FBaseQty'], return: 'array' }
                    let response = null
                    let page = 1
                    let per_page = 10000
                    while (!response || response.data.length === per_page) {
                        response = await StkInventory.query(options, { ...meta, page, per_page })
                        for (let d of response.data) {
                            if (inv_info[d[0]]) {
                                inv_info[d[0]] += d[1]
                            } else {
                                inv_info[d[0]] = d[1]
                            }
                        }
                        page++
                    }
                    stk_inv[obj.stock_id] = inv_info
                }
                for (let obj of this.bill.entry) {
                    if (!stk_inv[obj.stock_id]) continue
                    if (!stk_inv[obj.stock_id][obj.material_no]) continue
                    obj.stk_qty = stk_inv[obj.stock_id][obj.material_no]
                }
            },
            // 即时库存 - 快照
            async load_stk_inv_info_ss() {
                let options = { FBillNo: this.search_form.bill_no }
                let meta = { fields: ['FChildMtr.FNumber', 'F_PAEZ_Qty'], return: 'array' }
                let res = await PrdIssueMtrNotice.query(options, meta)
                let inv_info = {}
                for (let d of res.data) inv_info[d[0]] = d[1]
                for (let obj of this.bill.entry) obj.stk_qty = inv_info[obj.material_no] || 0
            },
            async load_pdf_data(ppbom) {
                let pdf_data = {
                    sale_order_no: ppbom.FSaleOrderNo,
                    workshop: ppbom['FWorkShopId.FName'],
                    qty: ppbom.FQty,
                    mo_bill_no: ppbom.FMoBillNo,
                    prd_line: '',
                    prd_time: '',
                    material_name: ppbom['FMaterialId.FName'],
                    material_spec: ppbom['FMaterialId.FSpecification'],
                    children: []
                }
                uni.showLoading({ title: 'Loading' })
                let mo_res = await PrdMo.query({ FBillNo: ppbom.FMoBillNo, FSeq: ppbom.FMoEntrySeq })
                if (mo_res.data.length) {
                    pdf_data.prd_line = mo_res.data[0]['F_LT_CX.FName']
                    pdf_data.prd_time = mo_res.data[0]['FPlanStartDate'].split('T')[0]
                }
                let options = { FBillNo: ppbom.FBillNo }
                let meta = {
                    fields: [ 'FMaterialId2', 'FMaterialId2.FNumber', 'FMaterialId2.FName', 'FMaterialId2.FSpecification', 'FMaterialId2.F_RGEN_Text_bzgx',
                              'FNumerator', 'FDenominator', 'FUnitId2.FName', 'FMustQty', 'FReplaceGroup'],
                    order: 'FReplaceGroup ASC'
                }
                let res = await PrdPpbom.query(options, meta)
                uni.hideLoading()
                for (let m of res.data) {
                    pdf_data.children.push({
                        material_no: m['FMaterialId2.FNumber'],
                        material_name: m['FMaterialId2.FName'],
                        material_spec: m['FMaterialId2.FSpecification'],
                        numerator: m.FNumerator,
                        unit_name: m['FUnitId2.FName'],
                        qty: m.FMustQty,
                        bzgx: m['FMaterialId2.F_RGEN_Text_bzgx']
                    })
                }
                this.pdf_data = pdf_data
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-list-item::v-deep {
        .uni-list-item__container {
            padding: 9px 15px;
        }
        .uni-list-item__content-title {
            font-weight: bold;
        }
        .uni-list-item__extra {
            flex: 2;
        }
        .uni-list-item__extra-text {
            color: #666;
            font-size: 13px;
        }
    }
    .uni-forms-item::v-deep {
        margin-bottom: 0;
        .uni-forms-item__label {
            color: #3b4144;
            font-weight: bold;
        }
    }

</style>
