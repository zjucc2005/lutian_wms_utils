<template>
    <uni-list>
        <uni-list-item title="按键提示音">
            <template #footer>
                <switch :checked="prompt_audio == 'on'" @change="switch_prompt_audio" />
            </template>
        </uni-list-item>
    </uni-list>
</template>

<script>
    export default {
        data() {
            return {
                prompt_audio: uni.getStorageSync('prompt_audio') || 'on' // 默认开启
            }
        },
        methods: {
            //（开启/关闭）按键提示音
            switch_prompt_audio() {
                if (this.prompt_audio == 'on') {
                    this.prompt_audio = 'off'
                } else {
                    this.prompt_audio = 'on'
                }
                uni.setStorageSync('prompt_audio', this.prompt_audio)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .uni-list-item::v-deep {
        .uni-list-item__container {
            align-items: center;
        }
    }
</style>
