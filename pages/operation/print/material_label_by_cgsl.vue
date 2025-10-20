<template>
    <uni-section title="查询收料通知单编号" type="square">
        <view class="searchbar-container">
            <uni-easyinput
                v-model="search_form.bill_no" 
                placeholder="请输入搜索内容"
                prefix-icon="scan"
                focus
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
    
    <uni-section title="物料明细" type="square"
        v-if="materials?.length"
        class="above-uni-goods-nav"
        >
        <uni-notice-bar single text="请在二维码生成后，再点击生成标签" />
        <uni-table v-if="$store.state.screen_type === 'h5'" ref="table" border stripe>
            <uni-tr>
                <uni-th align="center" width="60">序号</uni-th>
                <uni-th align="center" width="60">QR</uni-th>
                <uni-th align="center">物料编码</uni-th>
                <uni-th align="center">物料名称</uni-th>
                <uni-th align="center">规格型号</uni-th>
                <uni-th align="center">供应商</uni-th>
                <uni-th align="center" width="80">交货数量</uni-th>
                <uni-th align="center" width="80">收料单位</uni-th>
                <uni-th align="center">操作</uni-th>
            </uni-tr>
            
            <uni-tr v-for="(obj, index) in materials" :key="index">
                <uni-td align="center">{{ index + 1 }}</uni-td>
                <uni-td align="center">
                    <uqrcode :canvas-id="`qrcode_${index}`" :value="obj['FMaterialId.FNumber']" :size="40"></uqrcode>
                </uni-td>
                <uni-td>{{ obj['FMaterialId.FNumber'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId.FName'] }}</uni-td>
                <uni-td>{{ obj['FMaterialId.FSpecification'] }}</uni-td>
                <uni-td>{{ obj['FSupplierId.FName'] }}</uni-td>
                <uni-td align="center">{{ obj.FActReceiveQty }}</uni-td>
                <uni-td align="center">{{ obj['FUnitId.FName'] }}</uni-td>
                <uni-td align="center">
                    <uni-tag text="生成标签" type="primary" @click="gen_label(obj, `qrcode_${index}`)"/>
                </uni-td>
            </uni-tr>
        </uni-table>
        
        <uni-list v-else>
            <uni-list-item
                v-for="(obj, index) in materials"
                :key="index"
                @click="gen_label(obj, `qrcode_${index}`)" clickable
                show-arrow
                >
                <template #header>
                    <view class="uni-list-item__head">
                        <uqrcode :canvas-id="`qrcode_${index}`" :value="obj['FMaterialId.FNumber']" :size="40"></uqrcode>
                    </view>
                </template>
                <template #body>
                    <view class="uni-list-item__body">
                        <text class="title">{{ obj['FMaterialId.FNumber'] }}</text>
                        <view class="note">
                            <view>名称：{{ obj['FMaterialId.FName'] }}</view> 
                            <view>规格：{{ obj['FMaterialId.FSpecification'] }}</view>
                            <view>供应商：{{ obj['FSupplierId.FName'] }}</view>
                        </view>
                    </view>
                </template>
                <template #footer>
                    <view class="uni-list-item__foot">
                        <text>{{ obj['FActReceiveQty'] }} {{ obj['FUnitId.FName'] }}</text>
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
    import { formatDate } from '@/utils'
    import { PurReceiveBill } from '@/utils/model'
    import scan_code from '@/utils/scan_code'
    // #ifdef H5
    import { gen_pdf_label_demo } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                search_form: {
                    bill_no: ''
                },
                materials: [],
                goods_nav: {
                    options: [],
                    button_group: [
                        {
                            text: '扫码查询单据',
                            backgroundColor: store.state.goods_nav_color.red,
                            color: '#fff'
                        }
                    ]
                }
            }
        },
        methods: {
            gen_label(obj, canvas_id) {
                // #ifdef H5
                let options = {
                    no: obj['FMaterialId.FNumber'], 
                    name: obj['FMaterialId.FName'], 
                    spec: obj['FMaterialId.FSpecification'], 
                    supplier: obj['FSupplierId.FName'], 
                    inbound_time: formatDate(Date.now(), 'yyyy-MM-dd')
                }
                uni.canvasToTempFilePath({
                    canvasId: canvas_id,
                    success: function(res) { 
                        let url = gen_pdf_label_demo({ qr: res.tempFilePath, ...options })
                        uni.navigateTo({ url: `/pages/my/preview_pdf?url=${url}` }) // 打开预览页面
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
            },
            async handle_search(e) {
                if (this.search_form.bill_no) {
                    this.search_form.bill_no = this.search_form.bill_no.trim().toUpperCase()
                    if (this.search_form.bill_no.match(/^\d+$/)) {
                        this.search_form.bill_no = 'CGSL' + this.search_form.bill_no // 自动补充前缀
                    }
                    uni.showLoading({ title: 'Loading' })
                    let res = await PurReceiveBill.query({ FBillNo: this.search_form.bill_no })
                    this.materials = res.data
                    uni.hideLoading()
                    if (res.data.length === 0) {
                        uni.showToast({ icon: 'none', title: '单据编号不存在' })
                    }
                }
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
        }
    }
</script>

<style>

</style>
