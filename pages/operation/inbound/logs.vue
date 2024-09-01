<template>
    <view>
        <uni-section title="操作日志" type="line" style="padding-bottom: 80px;">
            <template v-slot:right>
                切换时间
            	<switch checked @change="" style="transform:scale(0.7)"/>
            </template>
            <uni-swipe-action>
                <uni-swipe-action-item
                    v-for="index in 100"
                    :key="index"
                    :threshold="60"
                    :right-options="swipe_action_options"
                    @click="swipe_action_click($event, index)"
                >
                    <uni-list-item title="{物料号} 上架 {数量} 到 { 仓位号}" rightText="2024-08-20" />
                </uni-swipe-action-item>
            </uni-swipe-action>
        </uni-section>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                swipe_action_options: [
                    {
                        text: '撤回',
                        style: {
                            backgroundColor: '#f56c6c'
                        }
                    }
                ]
            }
        },
        methods: {
            swipe_action_click(e, index) {
               console.log('swipe action click e:', e, index) 
            }
        }
    }
</script>

<style>

</style>
