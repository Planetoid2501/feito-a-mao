const GA_MEASUREMENT_ID = "G-8WTD3H3VLH";
const analyticsDebug = new URLSearchParams(location.search).get("analytics_debug") === "1";
// Local QA captures the same payloads without sending visits to the classroom property.
const analyticsLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
let analyticsAllowed = false;
let analyticsInitialized = false;
let currentAnalyticsPage = null;
let currentPageLocation = "";
let currentPageReferrer = document.referrer;
window.dataLayer = window.dataLayer || [];
window.analyticsDebugEvents = [];
function gtag() { window.dataLayer.push(arguments); }
function normalizePage(page) {
  const key = (page || "home").replace(/^#/, "");
  return ({inicio:"home",produtos:"catalogo"})[key] || key;
}
function analyticsUrl(page) {
  const url = new URL(location.href);
  const campaign = new URLSearchParams();
  ["utm_source","utm_medium","utm_campaign","utm_id","utm_term","utm_content","gclid"].forEach(key => {
    if (url.searchParams.has(key)) campaign.set(key, url.searchParams.get(key));
  });
  url.pathname = url.pathname.replace(/(?:index\.html)?$/, "").replace(/\/?$/, "/") + "virtual/" + page;
  url.search = campaign.toString();
  url.hash = "";
  return url.href;
}
function trackEvent(name, params = {}) {
  if (!analyticsAllowed) return false;
  const payload = {
    page_location: currentPageLocation || analyticsUrl(normalizePage(location.hash)),
    page_title: "Feito à Mão | " + (currentAnalyticsPage || normalizePage(location.hash)),
    page_referrer: currentPageReferrer,
    site_version: "amazonia-analytics-v2",
    traffic_environment: analyticsLocal ? "local" : "classroom",
    ...params,
    ...(analyticsDebug ? {debug_mode:true} : {})
  };
  if (analyticsDebug) {
    window.analyticsDebugEvents.push({event:name,params:payload});
    if (window.analyticsDebugEvents.length > 200) window.analyticsDebugEvents.shift();
    console.debug("[GA4]", name, payload);
  }
  if (!analyticsLocal) gtag("event", name, payload);
  return true;
}
function trackPage(page) {
  const next = normalizePage(page);
  if (!analyticsAllowed || currentAnalyticsPage === next) return;
  currentPageReferrer = currentPageLocation || document.referrer;
  currentAnalyticsPage = next;
  currentPageLocation = analyticsUrl(next);
  if (!analyticsLocal) gtag("set", {page_location:currentPageLocation,page_title:"Feito à Mão | "+next,page_referrer:currentPageReferrer});
  trackEvent("page_view");
}
function enableAnalytics() {
  if (analyticsAllowed) return;
  analyticsAllowed = true;
  window["ga-disable-" + GA_MEASUREMENT_ID] = false;
  if (!analyticsInitialized && !analyticsLocal) {
    analyticsInitialized = true;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, {send_page_view:false, page_location:analyticsUrl(normalizePage(location.hash)), ...(analyticsDebug ? {debug_mode:true} : {})});
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.append(script);
  }
  currentAnalyticsPage = null;
  trackPage(typeof visibleAnalyticsPage === "function" ? visibleAnalyticsPage() : location.hash);
  document.dispatchEvent(new Event("analytics-ready"));
}
function disableAnalytics() {
  analyticsAllowed = false;
  window["ga-disable-" + GA_MEASUREMENT_ID] = true;
  currentAnalyticsPage = null;
  currentPageLocation = "";
  window.analyticsDebugEvents.length = 0;
  document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    if (!name.startsWith("_ga")) return;
    const parts=location.hostname.split(".");
    for(let i=0;i<parts.length-1;i++) document.cookie=name+"=; Max-Age=0; path=/; domain="+parts.slice(i).join(".");
    document.cookie=name+"=; Max-Age=0; path=/";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  let choice; try { choice = localStorage.getItem("feitoAMaoConsent"); } catch {}
  const banner=document.querySelector("#cookie-banner");
  banner.hidden=!!choice;
  if(choice === "accepted") enableAnalytics();
  function choose(value) {
    try { localStorage.setItem("feitoAMaoConsent",value); } catch {}
    banner.hidden=true;
    if(value === "accepted") enableAnalytics(); else disableAnalytics();
  }
  document.querySelector("#accept-cookies").onclick=()=>choose("accepted");
  document.querySelector("#reject-cookies").onclick=()=>choose("rejected");
});
