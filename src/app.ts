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

  @property({ type: Boolean })
  private canShare = false;

  @property({ type: Boolean })
  private iframeError = false;

  @property({ type: String })
  private errorMessage = "Unable to load page";

  async connectedCallback() {
    super.connectedCallback();
    this.canShare = "share" in navigator;

    try {
      const response = await fetch("/sites.txt");
      const text = await response.text();
      const sites = text
        .split("\n")
        .filter((line) => line.trim())
        .map((feedUrl) => {
          try {
            let siteUrl = new URL(feedUrl).origin;
            // Replace http with https if needed
            if (siteUrl.startsWith("http:")) {
              siteUrl = siteUrl.replace("http:", "https:");
            }
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

    // Listen for CSP violations
    document.addEventListener("securitypolicyviolation", (e) => {
      debugger;
      if (
        e.blockedURI &&
        this.currentSite?.siteUrl.includes(new URL(e.blockedURI).hostname)
      ) {
        this.errorMessage = "Content blocked due to security policy";
        this.iframeError = true;
      }
    });
  }

  private _handleRandomClick() {
    const randomIndex = Math.floor(Math.random() * this.sites.length);
    const randomSite = this.sites[randomIndex];
    if (randomSite) {
      this.currentSite = randomSite;
    }
  }

  private async _handleShare(e: Event) {
    if (!this.currentSite) return;

    if (this.canShare) {
      e.preventDefault();
      try {
        await navigator.share({
          title: `RSS feed for ${this.currentSite.domain}`,
          text: `Subscribe to ${this.currentSite.domain}'s RSS feed`,
          url: this.currentSite.feedUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Ask user if they want to open in new tab
        if (
          confirm("Sharing didn't work, should I open the feed in a new tab?")
        ) {
          window.open(this.currentSite.feedUrl, "_blank");
        }
      }
    }
  }

  private _handleIframeError() {
    this.iframeError = true;
  }

  private _handleIframeLoad(e: Event) {
    const iframe = e.target as HTMLIFrameElement;
    try {
      // Try to access iframe content - will throw if blocked
      iframe.contentWindow?.location.href;
    } catch (error) {
      this.errorMessage = "Content blocked due to security policy";
      this.iframeError = true;
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
          <a href=${this.currentSite?.feedUrl} @click=${this._handleShare}
            >RSS</a
          >
        </header>
        <div class="content">
          ${this.currentSite
            ? html`
                <iframe
                  src=${this.currentSite.siteUrl}
                  @error=${this._handleIframeError}
                  @load=${this._handleIframeLoad}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                ></iframe>
                ${false && this.iframeError
                  ? html`<div class="error-overlay">
                      <p>${this.errorMessage}</p>
                      <p>
                        <a href=${this.currentSite.siteUrl} target="_blank"
                          >Open in new tab</a
                        >
                      </p>
                    </div>`
                  : null}
              `
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
      font-size: var(--s--1);
    }

    a:not([class]) {
      color: var(--color-link);
    }

    main {
      position: absolute;
      inset: var(--gap);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: var(--gap);
      /* handle iOS bottom bar */
      padding-block-end: 16px;
    }

    header {
      display: flex;
      align-items: space-between;
      gap: 1em;
    }
    .spacer {
      flex: 1;
    }
    .content {
      overflow: hidden;
      border-radius: var(--border-radius-panel);
      position: relative;
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

    .error-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--color-background);
      gap: var(--gap);
    }

    .error-overlay p {
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "x-app": App;
  }
}
