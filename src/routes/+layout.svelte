<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
</svelte:head>

<slot />

<style>
body {
  margin: 0;
  background: url('/bg.jpg') no-repeat center center fixed;
  background-size: cover;
  font-family: 'VT323', monospace;
  color: #eee;
}
</style>
