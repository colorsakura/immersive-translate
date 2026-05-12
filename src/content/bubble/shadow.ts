const HOST_ID = 'immersive-translate-bubble-host';

export function ensureBubbleHost(): { host: HTMLDivElement; shadowRoot: ShadowRoot } {
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '0';
    host.style.zIndex = '2147483647';
    host.style.all = 'initial';
    document.body.appendChild(host);
  }

  const shadowRoot = host.shadowRoot || host.attachShadow({ mode: 'open' });
  return { host, shadowRoot };
}

export function removeBubbleHost(): void {
  document.getElementById(HOST_ID)?.remove();
}

export function isInsideBubble(target: EventTarget | null): boolean {
  const host = document.getElementById(HOST_ID);
  if (!host || !(target instanceof Node)) {
    return false;
  }
  return host.contains(target) || host.shadowRoot?.contains(target) === true;
}
