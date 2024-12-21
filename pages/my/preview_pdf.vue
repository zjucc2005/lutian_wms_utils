<template>
    <web-view :src="pdf_url"></web-view>
</template>

<script>
    export default {
        props: {
            url: String
        },
        data() {
            return {
                pdf_url: ''
            }
        },
        onLoad(options) {
            if (options.url) {
                this.pdf_url = options.url
            }
        },
        methods: {
            
        }
    }
</script>

<style>

</style>
