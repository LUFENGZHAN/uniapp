<template>
	<view class="content">
		<video v-for="(item,i) in videosList" :src="item"></video>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				videosList:["https://mp-2a0e68a1-4e42-4285-b25e-1462368efa7f.cdn.bspapp.com/videos/hy.mp4"]
			};
		}
	}
</script>

<style lang="scss">
</style>
