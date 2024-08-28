<template>
    <view>
        <uni-collapse accordion>
        	<uni-collapse-item v-for="(val, key) in state" :key="key" :title="key">
                <view class="container">
                    <text class="text-sm">{{ val || 'null' }}</text>
                </view>
        	</uni-collapse-item>
        </uni-collapse>
    </view>
</template>

<script>
    import store from '@/store'
    export default {
        data() {
            return {
                state: store.state
            }
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
