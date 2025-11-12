<template>
    <uni-section title="二维码信息" type="square">
        <view class="searchbar-container">
            <uni-easyinput v-model="text"  />
        </view>
    </uni-section>
    
    <uni-section title="预览" type="square">
        <view class="container">
            <uqrcode v-if="text" ref="qrcode" :canvas-id="canvas_id" :value="text" :size="270"></uqrcode>
        </view>
    </uni-section>
</template>

<script>
    export default {
        data() {
            return {
                text: '',
                canvas_id: 'qrcode'
            }
        },
        methods: {
        }
    }
</script>

<style>
           
</style>
