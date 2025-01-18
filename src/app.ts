import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

type Site = {
  feedUrl: string;
  siteUrl: string;
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
            return { feedUrl, siteUrl };
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
        ${this.currentSite
          ? html`<iframe src=${this.currentSite.siteUrl}></iframe>`
          : null}
        <nav>
          <button type="button" @click=${this._handleRandomClick}>
            Random
          </button>
        </nav>
      </main>
    `;
  }

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      height: 100dvh;
    }

    main {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-rows: 1fr auto;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "x-app": App;
  }
}
