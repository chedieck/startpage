<script>
  import { sections, title, quote, nuvemURL } from '$lib/config';
  import { onMount } from 'svelte';
  let time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`

  let bgLoaded = false;

  onMount(() => {
    const img = new Image();
    img.src = '/time-waits-for-no-one.png';
    img.onload = () => {
      bgLoaded = true;
    };

    setInterval(() => {
  time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`
    }, 100)
  });

</script>

<style>
  .wrapper {
    background: #000 url('/time-waits-for-no-one.png') center center / cover no-repeat;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: opacity 0.2s ease;
    opacity: 0;
  }

  .wrapper.bg-loaded {
    opacity: 1;
  }

  .window {
    background: url('/window-nakamura.png') center center / cover no-repeat;
    justify-content: flex-start;
    width: 1000px;
    height: 610px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 0.5rem 0;
  }

  a {
    color: #00ffe5;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .top-container {
    box-sizing: border-box;
    padding-top: 0.7rem;
    padding-left: 1.5rem;
    padding-right: 1.7rem;
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 3.2rem;
  }
  .top-container .title {
    font-weight: bold;
    font-size: 1.3rem;
  }
  .top-container .time {
    font-weight: bold;
    font-size: 1.3rem;
  }
  .quote-text-container {
    box-sizing: border-box;
    padding-left: 21.8rem;
    width: 100%;
    height: 2.0rem;
    display: flex;
    flex-direction: row;
  }
  .quote-text {
    padding-top: 0.4rem;
    padding-left: 0.4rem;
    color: #222;
    font-style: italic;
    font-size: 1.2rem;
  }
  .main-container {
    box-sizing: border-box;
    display: flex;
    padding-left: 21rem;
    flex-direction: row;
    height: 100%;
    width: 100%;
  }
  .main {
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .nuvem {
    font-size: 2rem;
  }
  .lists-container {
    background-size: contain;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 3rem;
    height: 90%;
    width: 100%;
  }

  .column {
    padding: 1.5rem;
  }

  /*
  .main-container {
    background: grey;
    opacity: 70%;
  }
  .quote-text-container {
    background: yellow;
    opacity: 70%;
  }
  .top-container {
    background: green;
    opacity: 70%;
    }
  .main {
    background: purple;
    opacity: 70%;
  }
    /* debug */

</style>


<div class="wrapper" id="wrapper" class:bg-loaded={bgLoaded}>
  <div class="window">
    <div class="top-container">
      <div class="title">
        <span>{title}</span>
      </div>
      <div class="time">
        <span>{time}</span>
      </div>
    </div>
    <div class="quote-text-container">
      <div class="quote-text">
        <span>{quote}</span>
      </div>
    </div>
    <div class="main-container">
      <div class="main">
        <div class="nuvem">
          <a href={nuvemURL} rel="noopener noreferrer">☁️ Nuvem Foda</a>
        </div>

        <div class="lists-container">
          {#each sections as section}
            <div class="column">
              <h2>{section.icon} {section.title}</h2>
              <ul>
                {#each section.items as item}
                  <li>
                    <a href={item.url} rel="noopener noreferrer">{item.name}</a>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

