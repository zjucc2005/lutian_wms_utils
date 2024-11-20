<template>
    <view :style="{ width: width + 'px', height: width + 'px' }">
        <view :class="{'cc-grid-highlight': highlight }" class="cc-grid-item" @click="_click">
            <slot />
        </view>
    </view>
</template>

<script>
    export default {
        name: 'cc-grid-item',
        emits: ['click'],
        inject: ['grid'],
        data() {
            return {
                highlight: true
            }
        },
        created() {
            this.highlight = this.grid.highlight
        },
        computed: {
            width() {
                return this.grid.grid_width
            }
        },
        methods: {
            _click() {
                this.$emit('click')
            }
        }
    }
</script>

<style lang="scss">
    .cc-grid-item {
        height: 100%;
        display: flex;
        /* #ifdef H5 */
        cursor: pointer;
        /* #endif */
    }
	.cc-grid-highlight:active {
		background-color: #f1f1f1;
	}
</style>
