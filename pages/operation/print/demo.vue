<template>
    <uni-section title="标签信息" type="square">
        <view class="container">
            <uni-forms ref="form" :model="form" labelWidth="70px">
                <uni-forms-item label="物料编码" name="no">
                    <uni-easyinput v-model="form.no" trim="both" />
                </uni-forms-item>
                <uni-forms-item label="物料名称" name="copies">
                    <uni-easyinput v-model="form.name" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="规格型号" name="copies">
                    <uni-easyinput v-model="form.spec" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="供应商" name="copies">
                    <uni-easyinput v-model="form.supplier" trim="both"/>
                </uni-forms-item>
                <uni-forms-item label="入库时间" name="copies">
                    <uni-easyinput v-model="form.inbound_time" trim="both"/>
                </uni-forms-item>
                
                <button @click="submit" type="primary">
                    <uni-icons type="checkmarkempt" color="#fff"></uni-icons> 生成标签
                </button>
            </uni-forms>   
        </view>
    </uni-section>
    
    <uni-section title="预览" type="square">
        <view class="container">
            <uqrcode ref="qrcode" :canvas-id="canvas_id" :value="form.no" :size="270"></uqrcode>
        </view>
    </uni-section>
</template>

<script>
    // #ifdef H5
    import { gen_pdf_material_label } from '@/gen_pdf'
    // #endif
    export default {
        data() {
            return {
                form: {
                    no: '1.01.14.01.0125',
                    name: '六角法兰面螺栓-大JB',
                    spec: 'GB/T5789 M6*12',
                    inbound_time: '2025-10-15',
                    supplier: '温州标二'
                },
                canvas_id: 'qrcode'
            }
        },
        methods: {
            submit() {
                console.log('this.$data', this.$data)
                // #ifdef H5
                let _this_ = this;
                uni.canvasToTempFilePath({
                    canvasId: 'qrcode',
                    success: function(res) {
                        // 在H5平台下，tempFilePath 为 base64
                        // console.log(res.tempFilePath)
                        let url = gen_pdf_material_label({ qr: res.tempFilePath, ..._this_.form })
                        window.open(`#/pages/my/preview_pdf?url=${url}`, 'newWindow', 'width=800') // 打开小窗口
                    }
                })
                // #endif
            }
        }
    }
</script>

<style>

</style>
