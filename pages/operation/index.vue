<template>
    <view>
        <uni-grid :column="2" :highlight="true">
            <uni-grid-item @click="goTo('inbound/index')">
                <view class="grid-item-box">
                    <uni-icons type="download" class="inbound-icon" :size="80" color="#dd524d" />
                    <text class="text">入库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('outbound/index')">
                <view class="grid-item-box">
                    <uni-icons type="upload" class="outbound-icon" :size="80" color="#007aff" />
                    <text class="text">出库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item>
                <view class="grid-item-box">
                    <uni-icons type="compose" :size="80" color="#777" />
                    <text class="text">移库</text>
                </view>
            </uni-grid-item>
            <uni-grid-item @click="goTo('manage/index')">
                <view class="grid-item-box">
                    <uni-icons type="gear" :size="80" color="#999" />
                    <text class="text">仓库管理</text>
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
                uni.navigateTo({
                    url: `/pages/operation/${path}`
                })
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
    .text {
        font-size: 16px;
    }
    .inbound-icon {
        transform: rotate(90deg);
    }
    .outbound-icon {
        transform: rotate(90deg);
    }
</style>
