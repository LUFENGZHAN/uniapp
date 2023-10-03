<script>
	export default {
		onLaunch: function() {
			uni.getSystemInfo().then((res) => {
				console.log(res);
			})
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>

</style>