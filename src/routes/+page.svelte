<script>
  import { rows, title, quote } from '$lib/config';
  import { onMount } from 'svelte';
  let time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`

  let bgLoaded = false;

  onMount(() => {
    const img = new Image();
    img.src = '/time-waits-for-no-one.png';
    img.onload = () => {
      bgLoaded = true;
    };

    const interval = setInterval(() => {
  time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`
    }, 100)


    const shortcutMap = new Map();
    rows.forEach(row => {
      row.forEach(section => {
        section.items.forEach(item => {
          if (item.shortcut && item.shortcut !== "-") {
            shortcutMap.set(item.shortcut, item.url);
          }
        });
      })
    }
    );

  const handleKey = (e) => {
    const key = e.key;
    if (shortcutMap.has(key)) {
      window.location.href = shortcutMap.get(key);
    }
  };

  window.addEventListener('keydown', handleKey);

  return () => {
    window.removeEventListener('keydown', handleKey);
    clearInterval(interval);
  };


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
    transition: opacity 0.3s ease;
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

  .column h2 {
    width: 100%;
    text-align: center;
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
    height: 2.8rem;
    min-height: 2.8rem;
    /*min-height: 3rem;*/
  }
  .top-container .title {
    font-weight: bold;
    font-size: 1.3rem;
  }
  .top-container .time {
    font-weight: bold;
    font-size: 1.3rem;
  }
  .quote-container {
    box-sizing: border-box;
    padding-left: 21.8rem;
    width: 100%;
    /*min-height: 2.3rem;*/
    min-height: 2.4rem;
    height: 2.4rem;
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
    padding-left: 21.5rem;
    padding-right: 1.2rem;
    padding-bottom: 0.8rem;
    flex-direction: row;
    height: 100%;
    width: 100%;
  }
  .main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .lists-container {
    background-size: contain;
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    gap: 3rem;
    width: 100%;
  }

  .item {
    font-size: 1rem;
  }

  /*
  /* debug */
  .main-container {
    background: grey;
    opacity: 70%;
  }
  .quote-container {
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
    <div class="quote-container">
      <div class="quote-text">
        <span>{quote}</span>
      </div>
    </div>
    <div class="main-container">
      <div class="main">
      {#each rows as row}
        <div class="lists-container">
          {#each row as section}
            <div class="column">
              <h2>{section.icon} {section.title}</h2>
              <ul>
                {#each section.items as item}
                  <li class="item">
                    <a href={item.url} rel="noopener noreferrer">({item.shortcut}) {item.name}</a>
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      {/each}
      </div>
    </div>
  </div>
</div>

