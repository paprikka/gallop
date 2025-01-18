import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

type Site = {
  feedUrl: string;
  siteUrl: string;
  domain: string;
};

@customElement("x-app")
export class App extends LitElement {
  @property({ type: Array })
  private sites: Site[] = [];

  @property({ type: Object })
  private currentSite: Site | null = null;

  async connectedCallback() {
    super.connectedCallback();

    try {
      const response = await fetch("/sites.txt");
      const text = await response.text();
      const sites = text
        .split("\n")
        .filter((line) => line.trim())
        .map((feedUrl) => {
          try {
            const siteUrl = new URL(feedUrl).origin;
            const domain = new URL(siteUrl).hostname;
            return { feedUrl, siteUrl, domain };
          } catch (error) {
            console.error("Failed to parse site URL:", error);
            return null;
          }
        })
        .filter(Boolean) as Site[];

      this.sites = sites;
      this.currentSite = sites[0] || null;
    } catch (error) {
      console.error("Failed to load sites:", error);
    }
  }

  private _handleRandomClick() {
    const randomIndex = Math.floor(Math.random() * this.sites.length);
    const randomSite = this.sites[randomIndex];
    if (randomSite) {
      this.currentSite = randomSite;
    }
  }

  render() {
    return html`
      <main>
        <header>
          <a href=${this.currentSite?.siteUrl} target="_blank"
            >${this.currentSite?.domain}</a
          >
          <span class="spacer"></span>
          <a href=${this.currentSite?.siteUrl} target="_blank">New tab</a>
          <a href=${this.currentSite?.feedUrl}>RSS</a>
        </header>
        <div class="content">
          ${this.currentSite
            ? html`<iframe src=${this.currentSite.siteUrl}></iframe>`
            : null}
        </div>
        <footer>
          <button type="button" @click=${this._handleRandomClick} class="roll">
            🎲
          </button>
        </footer>
      </main>
    `;
  }

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      height: 100dvh;
      display: block;
      --gap: 0.3em;
    }

    main {
      position: absolute;
      inset: var(--gap);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: var(--gap);
    }

    header {
      display: flex;
      align-items: space-between;
      gap: var(--gap);
    }
    .spacer {
      flex: 1;
    }
    .content {
      overflow: hidden;
      border-radius: var(--border-radius-panel);
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    footer {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .roll {
      appearance: none;
      border: none;
      background: none;
      padding: 0;
      margin: 0;
      font-size: var(--s-5);
      cursor: pointer;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "x-app": App;
  }
}
