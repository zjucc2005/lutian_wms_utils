<template>
    <uni-section title="二维码信息" type="square">
        <view class="container">
            <uni-forms ref="form" :model="form" :label-width="72" class="search-form">
                <uni-forms-item label="内容" name="text">
                    <uni-easyinput v-model="form.text" trim />
                </uni-forms-item>
                <uni-forms-item label="尺寸" name="size">
                    <uni-data-checkbox v-model="form.size" mode="button"
                        :localdata="[
                            { text: '300', value: 300 },
                            { text: '400', value: 400 },
                            { text: '600', value: 600 },
                            { text: '800', value: 800 },
                        ]"
                    ></uni-data-checkbox>
                </uni-forms-item>
            </uni-forms>
            <button type="primary" size="mini" @click="gen_pic">生成</button>
        </view>
    </uni-section>
    
    <uni-section title="预览" type="square">
        <view class="container">
            <canvas ref="qrcode" id="qrcode" canvas-id="qrcode" :style="{ width: form.size + 'px', height: form.size + 'px' }"></canvas>
        </view>
    </uni-section>
</template>

<script>
    import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js';
    export default {
        data() {
            return {
                form: {
                    text: '',
                    size: 400,
                },
                canvas_id: 'qrcode'
            }
        },
        methods: {
            gen_pic() {
                this.gen_qrcode(this.text)
            },
            async gen_qrcode(text) {
                return new Promise((resolve, reject) => {
                    let uqr = new UQRCode();
                    uqr.data = text;
                    uqr.size = this.form.size;
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
        }
    }
</script>

<style>
           
</style>
