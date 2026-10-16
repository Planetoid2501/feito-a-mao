/*
  ANALYTICS — CONFIGURAÇÃO OPCIONAL DO GA4

  1. Crie uma propriedade no Google Analytics.
  2. Copie o ID de medição, no formato G-XXXXXXXXXX.
  3. Substitua G-XXXXXXXXXX no index.html e abaixo.
  4. Se ainda não tiver ID, o site funciona normalmente, mas não envia dados ao GA4.

  Nota: para um site público, configure consentimento e privacidade conforme
  as exigências aplicáveis. Não envie e-mails ou outros dados pessoais ao GA4.
*/
const GA_MEASUREMENT_ID = "G-8WTD3H3VLH";

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = window.gtag || gtag;

if (GA_MEASUREMENT_ID !== "G-8WTD3H3VLH") {
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === "function" && GA_MEASUREMENT_ID !== "G-8WTD3H3VLH") {
    window.gtag("event", eventName, params);
  }
}
window.trackEvent = trackEvent;
