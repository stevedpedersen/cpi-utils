<script>
	let { data } = $props();
    import { message } from '$lib/message.js';
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>
<p>{message}</p>
