<template>
    <uni-section title="查询生产订单编号" type="square" @click="$logger.info('>>>', $data)">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入搜索内容"
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
    
    <uni-section v-if="ppboms.length" title="生产订单" type="square"
        sub-title="请在二维码生成以后，再点击生成PDF文件" sub-title-color="#007aff"
        class="above-uni-goods-nav"
        >
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center" width="60">QR</uni-th>
                <uni-th align="center" width="120">生产订单编号</uni-th>
                <uni-th align="center">计划跟踪单号</uni-th>
                <uni-th align="center">产品编码</uni-th>
                <uni-th align="center">产品名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center" width="80">生产数量</uni-th>
                <uni-th align="center">单位</uni-th>
                <uni-th align="center">生产车间</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in ppboms" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td align="center">
                    <uqrcode :canvas-id="`qrcode_${index}`" :value="obj.FMoBillNo" :size="40"></uqrcode>
                </uni-td>
                <uni-td>{{ obj.FMoBillNo }}</uni-td>
                <uni-td>{{ obj.FSaleOrderNo }}</uni-td>
                <uni-td>{{ obj['FMaterialId.FNumber'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId.FName'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId.FSpecification'] }}</uni-td>
                <uni-td align="center">{{ obj.FQty }}</uni-td>
                <uni-td align="center">{{ obj['FUnitId.FName'] }}</uni-td>
                <uni-td align="center">{{ obj['FWorkShopId.FName'] }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="生成PDF" type="primary" @click="gen_pdf(obj, `qrcode_${index}`)"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item v-for="(obj, index) in ppboms" :key="index"
                @click="gen_pdf(obj, `qrcode_${index}`)" clickable 
                show-arrow
                >
                <template #header>
                    <view class="uni-list-item__head">
                        <uqrcode :canvas-id="`qrcode_${index}`" :value="obj.FMoBillNo" :size="40"></uqrcode>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-badge :text="`${obj.FMoEntrySeq}`" type="primary" />
                            {{ obj.FBillNo }} / {{ obj.FMoBillNo }}
                        </view>
                        <view class="note">
                            <view>计划跟踪单号：{{ obj.FSaleOrderNo }}</view>
                            <view>生产车间：{{ obj['FWorkShopId.FName'] }}</view>
                            <view>产品编码：{{ obj['FMaterialId.FNumber'] }}</view>
                            <view>产品名称：{{ obj['FMaterialId.FName'] }}</view>
                            <view>规格型号：{{ obj['FMaterialId.FSpecification'] }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ obj.FQty }} {{ obj['FUnitId.FName'] }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <view v-if="$store.state.screen_type === 'app-plus'" class="uni-goods-nav-wrapper">
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
    import { PrdPpbom, PrdMo } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    // #ifdef H5
    import { gen_pdf_mo_confirming } from '@/gen_pdf'
    // #endif
    
    export default {
        data() {
            return {
                search_form: {
                    bill_no: ''
                },
                ppboms: [],
                pdf_data: {},
                goods_nav: {
                    options: [],
                    button_group: [
                        { text: '扫描单据', backgroundColor: store.state.goods_nav_color.red, color: '#fff' }
                    ]
                }
            }
        },
        mounted() {
            // this.handle_search()
        },
        methods: {
            searchbar_icon_click(e) {
                if (e == 'prefix') this.scan_code()
            },
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('>>>', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.scan_code() // btn:扫码查询单据
            },
            scan_code() {
                scan_code().then(res => {
                    this.search_form.bill_no = res.result
                    this.handle_search()
                }).catch(err => {
                    uni.showToast({ icon: 'none', title: err })
                })
            },
            async gen_pdf(ppbom, canvas_id) {
                // #ifdef H5
                await this.load_pdf_data(ppbom)
                let _this_ = this
                uni.canvasToTempFilePath({
                    canvasId: canvas_id,
                    success: function(res) { 
                        let url = gen_pdf_mo_confirming({
                            ..._this_.pdf_data,
                            qr: res.tempFilePath, 
                        })
                        window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=1080,height=960') // 打开小窗口
                    }
                })
                // #endif
                // #ifdef APP-PLUS
                    uni.showModal({ title: '提示', content: '仅PC端支持打印' })
                // #endif
            },
            async handle_search(e) {
                this.ppboms = []
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim()
                    let options = { FMoBillNo: this.search_form.bill_no }
                    let meta = {
                        fields: [ 'FID', 'FBillNo', 'FMoBillNo', 'FMoEntrySeq', 'FSaleOrderNo', 'FWorkShopId.FName', 
                                  'FMaterialId', 'FMaterialId.FNumber', 'FMaterialId.FName', 'FMaterialId.FSpecification',
                                  'FQty', 'FUnitId.FName' ],
                        replace_fields: true,
                        order: 'FMoEntrySeq ASC'
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await PrdPpbom.query(options, meta)
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none', title: '单据编号不存在' })
                    } else {
                        this.ppboms = res.data
                    }
                }
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
                    replace_fields: true,
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

<style>
           
</style>
