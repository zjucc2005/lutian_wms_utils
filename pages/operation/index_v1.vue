<template>
    <view>
        <uni-grid :column="2" :highlight="true">
            <uni-grid-item @click="goTo('inbound/v1/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/inbound.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">入库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('outbound/v1/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/outbound.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">出库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('move/v1/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/move.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">库存调整</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('manage/index')">
                <view class="grid-item-box">
                    <image src="/static/icon/gear.png" mode="widthFix" class="grid-item-icon"></image>
                    <text class="grid-item-text">仓库管理</text>
                </view>
            </uni-grid-item>
        </uni-grid>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            goTo(path) {
                uni.navigateTo({ url: `/pages/operation/${path}` })
            }
        }
    }
</script>

<style>
    .grid-item-box {
        flex: 1;
        /* #ifndef APP-NVUE */
        display: flex;
        /* #endif */
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px 0;
    }
    .grid-item-text {
        font-size: 16px;
        color: #666;
        font-weight: bold;
        margin-top: 6px;
        
    }
    .grid-item-icon {
        width: 80px;
    }
</style>
