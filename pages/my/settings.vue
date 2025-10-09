<template>
    <uni-list>
       <!-- <uni-list-item title="按键提示音">
            <template #footer>
                <switch :checked="prompt_audio == 1" @change="set_config('prompt_audio')" />
            </template>
        </uni-list-item> -->
        <uni-list-item v-for="(config, k) in configs" :key="k" :title="config.label">
            <template #footer>
                <switch :checked="config.value === 'y'" @change="set_config(k)" />
            </template>
        </uni-list-item>
    </uni-list>
</template>

<script>
    export default {
        data() {
            return {
                configs: {
                    prompt_audio: { label: '按键提示音', value: uni.getStorageSync('prompt_audio') || 'y' }, // 默认开启
                    shelf_accordion: { label: '货架手风琴模式', value: uni.getStorageSync('shelf_accordion') || 'n' }, // 默认关闭
                },
                // prompt_audio: uni.getStorageSync('prompt_audio') || 1, 
                // shelf_accordion: uni.getStorageSync('shelf_accordion') || 0, 
            }
        },
        methods: {
            //（开启/关闭）按键提示音
            // switch_prompt_audio() {
            //     if (this.prompt_audio == 1) {
            //         this.prompt_audio = 0
            //     } else {
            //         this.prompt_audio = 1
            //     }
            //     uni.setStorageSync('prompt_audio', this.prompt_audio)
            // },
            set_config(k) {
                console.log('set_config', k)
                if (this.configs[k].value === 'y') {
                    this.configs[k].value = 'n'
                } else {
                    this.configs[k].value = 'y'
                }
                uni.setStorageSync(k, this.configs[k].value)
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
