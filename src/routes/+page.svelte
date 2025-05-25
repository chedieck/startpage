<script>
    const sections = [
        {
            title: 'Work',
            items: [
              { name: 'Client', url: 'https://example.com/work-repo' },
              { name: 'Server', url: 'https://example.com/work-repo' },
              { name: 'Staking', url: 'https://example.com/private-repo' },
              { name: 'Poker', url: 'https://example.com/private-repo' },
              { name: 'Poker Software', url: 'https://example.com/private-repo' },
            ],
            icon: '💼'
        },
        {
            title: 'Entertainment',
            items: [
                { name: 'YouTube', url: 'https://www.youtube.com/feed/subscriptions' },
            ],
            icon: '🎮'
        },
        {
            title: 'Study',
            items: [
                { name: 'HackTheBox', url: 'https://hackthebox.com' },
                { name: 'TryHackMe', url: 'https://tryhackme.com' },
            ],
            icon: '📚'
        }
    ];
</script>

<style>
  .wrapper {
    background: url('/time-waits-for-no-one.png') center center / cover no-repeat;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
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

  .top-pad {
    width: 100%;
    height: 3.5rem;
    margin-top: 0px;
  }
  .title-text-container {
    width: 100%;
    height: 2.0rem;
    margin-top: 0px;
    display: flex;
    flex-direction: row;
  }
  .title-text-left-pad {
    width: 21.5rem;
    height: 2.0rem;
  }
  .title-text {
    padding-top: 0.1rem;
    padding-left: 0.4rem;
    color: black;
    font-size: 1.5rem;
  }
  .main-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
  }
  .main-container-left-pad {
    height: 100%;
    width: 23rem;
    margin-top: 0px;
    display: flex;
    flex-direction: row;
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
  }

  .column {
    padding: 1.5rem;
  }

  /*
  .main-container-left-pad {
    background: red;
    opacity: 70%;
  }
  .main-container {
    background: grey;
    opacity: 70%;
  }
  .title-text-left-pad {
    background: blue;
    opacity: 70%;
  }
  .title-text-container {
    background: yellow;
    opacity: 70%;
  }
  .top-pad {
    background: green;
    opacity: 70%;
    }
  .main {
    color:  purple;
  }
    /* debug */

</style>


<div class="wrapper">
  <div class="window">
    <div class="top-pad"></div>
    <div class="title-text-container">
      <div class="title-text-left-pad"></div>
      <div class="title-text">
        <span> bla</span>
      </div>
    </div>
    <div class="main-container">
      <div class="main-container-left-pad"></div>
      <div class="main">
        <div class="nuvem">
          <a href="https://my.nuvem.com" rel="noopener noreferrer">Nuvem Foda</a>
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

