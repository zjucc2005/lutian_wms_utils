<template>
    <view class="cc-grid-wrap">
        <view ref="cc-grid" class="cc-grid">
            <slot />
        </view>
    </view>
</template>

<script>
    import store from '@/store'
    /**
     * Grid 宫格
     * @description 宫格组件
     * @property {Number} column 每列显示个数
     * @property {Boolean} Boolean 点击背景是否高亮
     */
    export default {
        name: 'cc-grid',
        props: {
            column: {
                type: Number
            },
            highlight: {
                type: Boolean,
                default: true
            }
        },
        provide() {
            return {
                grid: this
            }
        },
        data() {
            return {
                
            };
        },
        computed: {
            grid_width() {
                let window_width = store.state.system_info.windowWidth
                if (this.column) return window_width / this.column
                let column = window_width >= 768 ? 6 : 3
                return Math.max(96, window_width / column) 
            }
        }
    }
</script>

<style lang="scss" scoped>
    .cc-grid-wrap {
        display: flex;
        flex: 1;
        flex-direction: column;
        /* #ifdef H5 */
        width: 100%;
        /* #endif */
    }
    .cc-grid {
        display: flex;
        // flex: 1;
        flex-direction: row;
        flex-wrap: wrap;
    }
</style>