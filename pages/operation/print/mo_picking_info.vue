<template>
    <uni-section title="物流拣选单" type="square" @click="$logger.info('>>>', $data)"
        sub-title="请在二维码生成以后，再点击生成PDF文件" sub-title-color="#007aff"
        >
        <uni-list>
            <uni-list-item>
                <template #header>
                    <view class="uni-list-item__head">
                        <uqrcode :canvas-id="`qrcode_${pdf_data.id}`" :value="pdf_data.mo_bill_no" :size="40"></uqrcode>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            {{ pdf_data.bill_no }} / {{ pdf_data.mo_bill_no }}
                        </view>
                        <view class="note">
                            <view>计划跟踪单号：{{ pdf_data.sale_order_no }}</view>
                            <view>生产车间：{{ pdf_data.workshop }}</view>
                            <view>产线：{{ pdf_data.prd_line }}</view>
                            <view>计划上线时间：{{ pdf_data.prd_time }}</view>
                            <view>产品编码：{{ pdf_data.material_no }}</view>
                            <view>产品名称：{{ pdf_data.material_name }}</view>
                            <view>规格型号：{{ pdf_data.material_spec }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ pdf_data.qty }} {{ pdf_data.unit_name }}</view>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>
    </uni-section>
    
    <uni-section v-if="pdf_data.id" title="明细" type="square" class="above-uni-goods-nav">
        <uni-list>
            <uni-list-item v-for="(m, index) in pdf_data.children" :key="index">
                <template #body>
                    <view class="uni-list-item__body">
                        <view class="title">
                            <uni-badge :text="`${index+1}`" type="primary" />
                            {{ m.material_no }} / {{ m.material_name }}
                        </view>
                        <view class="note">
                            <view>规格：{{ m.material_spec }}</view>
                            <view>分子：{{ m.numerator }}</view>
                            <view>工序：{{ m.bzgx }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <view>{{ m.qty }} {{ m.unit_name }}</view>
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
    import { PrdPpbom, PrdMo } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    // #ifdef H5
    import { gen_pdf_mo_picking } from '@/gen_pdf'
    // #endif
    
    export default {
        data() {
            return {
                pdf_data: {},
                goods_nav: {
                    options: [],
                    button_group: [
                        { text: '生成PDF', backgroundColor: store.state.goods_nav_color.blue, color: '#fff' }
                    ]
                }
            }
        },
        onLoad(options) {
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.on('moPickingInfo', res => {
                this.load_pdf_data(res.data)
            })
        },
        mounted() {
        },
        methods: {
            goods_nav_click(e) {
                if (e.index === 0) this.$logger.info('>>>', this.$data)
            },
            goods_nav_button_click(e) {
                if (e.index === 0) this.gen_pdf() // btn:生成PDF
            },
            gen_pdf() {
                // #ifdef H5
                let _this_ = this
                uni.canvasToTempFilePath({
                    canvasId: `qrcode_${_this_.pdf_data.id}`,
                    success: function(res) { 
                        let url = gen_pdf_mo_picking({
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
            async load_pdf_data(ppbom) {
                let pdf_data = {
                    id: ppbom.FID,
                    sale_order_no: ppbom.FSaleOrderNo,
                    workshop: ppbom['FWorkShopId.FName'],
                    qty: ppbom.FQty,
                    unit_name: ppbom['FUnitId.FName'],
                    bill_no: ppbom.FBillNo,
                    mo_bill_no: ppbom.FMoBillNo,
                    prd_line: '',
                    prd_time: '',
                    material_no: ppbom['FMaterialId.FNumber'],
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
