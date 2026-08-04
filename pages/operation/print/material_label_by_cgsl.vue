<template>
    <canvas ref="qrcode" id="qrcode" canvas-id="qrcode" class="canvas-hidden"></canvas>
    <uni-section title="查询收料通知单编号" type="square" @click="debug">
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
    
    <uni-section v-if="materials?.length" title="物料明细" type="square"
        sub-title="打印份数可编辑" sub-title-color="#007aff" class="above-uni-goods-nav">
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe style="min-height: 400px;">
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <!-- <uni-th align="center" width="60">QR</uni-th> -->
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" filter-type="select" :filter-data="stock_opts" @filter-change="filter_change">仓库</uni-th>
                <uni-th align="center">供应商</uni-th>
                <uni-th align="center" width="80">交货数量</uni-th>
                <uni-th align="center" width="80">收料单位</uni-th>
                <uni-th align="center" width="92">按托标签数</uni-th>
                <uni-th align="center" width="92">按箱标签数</uni-th>
                <uni-th align="center" width="92">打印份数</uni-th>
                <!-- <uni-th align="center" width="80">操作</uni-th> -->
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in materials_filtered" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
               <!-- <uni-td align="center">
                    <uqrcode :canvas-id="`qrcode_${index}`" :value="obj.no" :size="40"></uqrcode>
                </uni-td> -->
                <uni-td>{{ obj.no }}</uni-td>
                <uni-td>{{ obj.name }}</uni-td>
                <uni-td>{{ obj.spec }}</uni-td>
                <uni-td>{{ obj.stock_name }}</uni-td>
                <uni-td>{{ obj.supplier }}</uni-td>
                <uni-td align="center">{{ obj.qty }}</uni-td>
                <uni-td align="center">{{ obj.unit }}</uni-td>
                <uni-td align="center">{{ obj.plt_print_copies }}</uni-td>
                <uni-td align="center">{{ obj.box_print_copies }}</uni-td>
                <uni-td align="center">
                    <uni-easyinput
                        v-model="obj.print_copies"
                        type="number"
                        @change="if (obj.print_copies < 0) obj.print_copies = 0;"
                        :clearable="false"
                        :input-border="false"
                        :style="{ textAlign: 'center' }"
                        />
                </uni-td>
                <!-- <uni-td align="center">
                    <uni-tag text="生成标签" type="primary" size="mini" @click="gen_label(obj, `qrcode_${index}`)"/>
                </uni-td> -->
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in materials_filtered" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title text-bold">{{ obj.no }} {{ obj.name }}</text>
                        <view class="note">
                            <view>{{ obj.spec }}</view>
                            <view>仓库：<text class="text-primary">{{ obj.stock_name }}</text></view>
                            <view>供应商：{{ obj.supplier }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text>x {{ obj.print_copies }}</text>
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
</template>

<script>
    import store from '@/store'
    import { formatDate } from '@/utils'
    import { PurReceiveBill } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
    // #ifdef H5
    import { gen_pdf_material_label, gen_pdf_material_label_batch } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                search_form: {
                    bill_no: ''
                },
                materials: [],
                filter: '',
                stock_opts: [],
                goods_nav: {
                    options: [
                        { icon: 'list', text: '操作' },
                    ],
                    button_group: [
                        { text: '扫码查询', backgroundColor: store.state.goods_nav_color.red, color: '#fff' },
                        { text: '生成PDF', backgroundColor: store.state.goods_nav_color.grey, color: '#fff' }
                    ]
                }
            }
        },
        computed: {
            materials_filtered() {
                if (!this.filter?.length) return this.materials
                return this.materials.filter(x => this.filter.includes(x.stock_name))
            }
        },
        methods: {
            debug() {
                this.$logger.info('>>>', this.$data)
            },
            filter_change(e) {
                this.filter = e.filter
            },
            goods_nav_click(e) {
                if (e.index === 0) {
                    uni.showActionSheet({
                        itemList: ['打印份数=0', '打印份数=1', '打印份数=按托标签数', '打印份数=按箱标签数'],
                        success: (e) => {
                            if (e.tapIndex === 0) {
                                for (let obj of this.materials) obj.print_copies = 0
                            }
                            if (e.tapIndex === 1) {
                                for (let obj of this.materials) obj.print_copies = 1
                            }
                            if (e.tapIndex === 2) {
                                for (let obj of this.materials) {
                                    if (typeof obj.plt_print_copies === 'number') {
                                        obj.print_copies = obj.plt_print_copies
                                    }
                                }
                            }
                            if (e.tapIndex === 3) {
                                for (let obj of this.materials) {
                                    if (typeof obj.box_print_copies === 'number') {
                                        obj.print_copies = obj.box_print_copies
                                    }
                                }
                            }
                        }
                    })
                }
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
                if (e.index === 1) this.gen_label()
            },
            goods_nav_button_switch() {
                if (this.materials.length) {
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.blue
                } else {
                    this.goods_nav.button_group[1].backgroundColor = store.state.goods_nav_color.grey
                }
            },
            reset() {
                this.materials = []
                this.filter = []
                this.stock_opts = []
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            async search(e) {
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'CGSL' + this.search_form.bill_no // 自动补充前缀
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await PurReceiveBill.query({ FBillNo: this.search_form.bill_no })
                    this.handle_data(res)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none', title: '单据编号不存在' })
                    }
                } else {
                    this.reset()
                }
                this.goods_nav_button_switch()
            },
            handle_data(res) {
                let materials = []
                let stock_opts = new Set()
                let t = formatDate(Date.now(), 'yyyy-MM-dd')
                for (let obj of res.data) {
                    let material = materials.find(x => x.id == obj.FMaterialId && x.stock_name == obj['FStockId.FName'])
                    if (material) {
                        material.qty += obj['FActReceiveQty']
                    } else {
                        materials.push({
                            id: obj.FMaterialId,
                            no: obj['FMaterialId.FNumber'],
                            name: obj['FMaterialId.FName'],
                            spec: obj['FMaterialId.FSpecification'],
                            stock_name: obj['FStockId.FName'],
                            supplier: obj['FSupplierId.FName'],
                            qty: obj['FActReceiveQty'],
                            unit: obj['FUnitId.FName'],
                            plt_std_qty: obj['FMaterialId.F_RGEN_Text_qtr'] * 1,
                            box_std_qty: obj['FMaterialId.FBoxStandardQty'],
                            inbound_time: t,
                            print_copies: 1
                        })
                    }
                    stock_opts.add(obj['FStockId.FName'])
                }
                for (let material of materials) {
                    material.plt_print_copies = material.plt_std_qty ? Math.ceil(material.qty / material.plt_std_qty) : 'NA'
                    material.box_print_copies = material.box_std_qty ? Math.ceil(material.qty / material.box_std_qty) : 'NA'
                }
                
                this.materials = materials
                this.stock_opts = Array.from(stock_opts).map(x => { return { value: x, text: x } })
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
            async gen_label(obj, canvas_id) {
                // #ifdef H5
                    for (let d of this.materials_filtered) {
                        if (!d._qr) d._qr = await this.gen_qrcode(d.no)
                    }
                    let url = gen_pdf_material_label_batch(this.materials_filtered.filter(x => x.print_copies > 0))
                    window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800,height=600') // 打开小窗口
                // #endif
                // #ifdef H5
                // uni.canvasToTempFilePath({
                //     canvasId: canvas_id,
                //     success: function(res) { 
                //         let url = gen_pdf_material_label({
                //             ...obj,
                //             qr: res.tempFilePath, 
                //             inbound_time: formatDate(Date.now(), 'yyyy-MM-dd'),
                //         })
                //         window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800,height=600') // 打开小窗口
                //     }
                // })
                // #endif
                // #ifdef APP-PLUS
                    uni.showModal({ title: '提示', content: '仅PC端支持打印' })
                // #endif
            },
        }
    }
</script>

<style>

</style>
