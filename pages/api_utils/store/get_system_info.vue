<template>
    <view class="container">
        <text class="text-sm">{{ res }}</text>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                res: {}
            }
        },
        mounted() {
            uni.getSystemInfo({
                success: (res) => {
                	console.log('uni.getSystemInfo:', res)
                    this.res = res
                }
            })
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
