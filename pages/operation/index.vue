<template>
    <view>
        <uni-section>
            <uni-grid :column="2" :highlight="true">
                <uni-grid-item @click="goPage('inbound')">
                    <view class="grid-item-box">
                        <uni-icons type="download" class="inbound-icon" :size="80" color="#007aff" />
                        <text class="text">入库</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item>
                    <view class="grid-item-box">
                        <uni-icons type="upload" class="outbound-icon" :size="80" color="#777" />
                        <text class="text">出库</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item>
                    <view class="grid-item-box">
                        <uni-icons type="compose" :size="80" color="#777" />
                        <text class="text">移库</text>
                    </view>
                </uni-grid-item>
                <uni-grid-item>
                    <view class="grid-item-box">
                        <uni-icons type="home" :size="80" color="#777" />
                        <text class="text">库存明细</text>
                    </view>
                </uni-grid-item>          
            </uni-grid>
        </uni-section> 
    </view>
</template>

<script>
    export default {
        data() {
            return {
                
            }
        },
        methods: {
            goPage(category) {
                uni.navigateTo({
                    url: `/pages/operation/${category}/index`
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
