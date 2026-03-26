<script>
  import { tabs_dict, title, quote } from '$lib/config';
  import { onMount } from 'svelte';
  let time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`

  let bgLoaded = false;

  let currentTabIndex = 0;
  const tabs = Object
  .keys(tabs_dict)
  .sort((a, b) => Number(a) - Number(b))
  .map(k => tabs_dict[Number(k)].data);
  $: currentRows = tabs[currentTabIndex];

  function buildShortcutMap(rows) {
    const shortcutMap = new Map();
    rows.forEach(row => {
      row.forEach(section => {
        section.items.forEach(item => {
          if (item.shortcut && item.shortcut !== "-") {
            shortcutMap.set(item.shortcut, item.url);
          }
        });
      });
    });
    return shortcutMap;
  }

  $: shortcutMap = buildShortcutMap(currentRows);

  onMount(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => {
      bgLoaded = true;
    };

    const interval = setInterval(() => {
      time = `${(new Date()).toLocaleDateString()} @${(new Date()).toLocaleTimeString()}`
    }, 100)

    const handleKey = (e) => {
      const key = e.key;

      // Tab navigation
      if (key === 't') {
        currentTabIndex = (currentTabIndex + 1) % tabs.length;
        return;
      }
      if (key === 'T') {
        currentTabIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
        return;
      }

      // Shortcut navigation
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
  .empty {
    z-index: -1281;
  }
  .wrapper {
    background: #000 url('/background.png') center / cover no-repeat;
    width: 100vw;
    height: 100vh;
    display: grid;
    place-items: center;
  }

  .wrapper.bg-loaded {
    opacity: 1;
  }

  /* === Scene container (scales everything together) === */

  .scene {
    position: relative;
    width: min(1000px, 95vw, calc(95vh * 1000 / 610));
    aspect-ratio: 1000 / 610;

  font-size: clamp(12px, 1.35vmin, 18px);
  }


  .frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
  }

  /* === Overlay layers === */

  .window-content,
  .top-container,
  .quote-container,
  .tab-bar-container,
  .main-container {
    position: absolute;
    z-index: 2;
    box-sizing: border-box;
  }

  /* Left window image */

  .window-content {
    left: 2.1%;
    top: 8.8%;
    width: 31.5%;
    height: 88.5%;
    background: url('/window-content.png') center / cover no-repeat;
  }

  /* === Top bar === */

  .top-container {
    left: 0;
    top: 0;
    width: 100%;
    height: 8.5%;
    padding: 1.2% 2%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .top-container .title,
  .top-container .time {
    font-weight: bold;
    font-size: 1.3em;
  }

  /* === Quote row === */

  .quote-container {
    left: 34.2%;
    top: 8.4%;
    width: 64.5%;
    height: 5.5%;
    display: flex;
    align-items: center;
    padding-left: 1%;
  }

  .quote-text {
    color: #222;
    font-style: italic;
    font-size: 1.2em;
  }

  /* === Tabs === */

  .tab-bar-container {
    left: 40%;
    top: 15.5%;
    width: 50%;
    height: 9%;
    display: flex;
    align-items: center;
  }

  .tab-bar {
    width: 100%;
    display: flex;
    gap: 1.5rem;
    justify-content: space-around;
    flex-wrap: nowrap;
  }

  .tab-title.active h1 {
    font-weight: 600;
    color: yellow;
    text-shadow:
      -1px 0 0 blue,
      0 -1px 0 blue;
  }

  .tab-title h1 {
    text-align: center;
    color: blue;
    text-shadow:
      -1px 0 0 yellow,
      0 -1px 0 yellow;
  }

  /* === Main content === */

  .main-container {
    left: 34.8%;
    top: 24.5%;
    width: 62.5%;
    height: 72%;
    padding: 1%;
    display: flex;
  }

  .main {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .lists-container {
    display: flex;
    gap: 3rem;
    width: 100%;
    height: 50%;
  }

  .column {
    width: 50%;
  }

  /* === Typography === */

  h2 {
    font-size: 2em;
    margin-bottom: 1rem;
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

  .item {
    font-size: 1.1em;
  }


  /*
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
  .tab-title {
  background: magenta;
  opacity: 70%;
  }
  .column {
  background: yellow;
  border: solid 1px black;
  }
  .lists-container {
  background: cyan;
  border: solid 1px black;
  opacity: 70%;
  }
  .window-content {
  background: blue;
  opacity: 70%;
  }
  .main {
  background: purple;
  opacity: 70%;
  }
  /* debug */

</style>


<div class="wrapper" id="wrapper" class:bg-loaded={bgLoaded}>
  <div class="scene">
    <img class="frame" src="/window-frame.png" alt=""/>
    <div class="window-content"> </div>
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
    <div class="tab-bar-container">
      <div class="tab-bar">
        {#each Object.values(tabs_dict) as tab, i (i)}
          <div
            class="tab-title"
            class:active={i === currentTabIndex}
            on:click={() => currentTabIndex = i}
          >
            <h1>
              HE{tab.title}
            </h1>
          </div>
        {/each}
      </div>
    </div>
    <div class="main-container">
      <div class="main">
        {#each currentRows as row}
          <div class="lists-container">
            {#each row as section}
              <div class="column {section.items.length === 0 ? 'empty' : ''}">
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

