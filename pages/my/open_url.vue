<template>
    <web-view :src="url"></web-view>
</template>

<script>
    export default {
        props: {
            url: String
        },
        data() {
            return {
                url: ''
            }
        },
        onLoad(options) {
            if (options.url) {
                this.url = options.url
            }
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
