// Serves the embeddable loader script businesses paste into their own
// website: <script src="{APP_BASE_URL}/api/embed/widget.js" data-business="BIZ_ID" async></script>
// The script injects a floating chat bubble that toggles an iframe pointing
// at app/widget/[businessId]/page.tsx — everything the chat itself needs
// (auth-free, business-scoped) lives on our domain, so the loader stays a
// few lines and never touches the customer site's DOM beyond the bubble.
export async function GET(request: Request) {
  const appBaseUrl = process.env.APP_BASE_URL ?? new URL(request.url).origin;

  const script = `(function () {
  var currentScript = document.currentScript;
  var businessId = currentScript && currentScript.getAttribute("data-business");
  if (!businessId) {
    console.error("Oviflow chat widget: missing data-business attribute on the script tag.");
    return;
  }

  var baseUrl = ${JSON.stringify(appBaseUrl)};
  var open = false;

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open chat");
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;" +
    "background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(124,58,237,0.35);z-index:2147483000;" +
    "display:flex;align-items:center;justify-content:center;transition:transform .15s ease;";
  bubble.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v11H7l-3 3V4z" stroke="white" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  bubble.onmouseenter = function () { bubble.style.transform = "scale(1.06)"; };
  bubble.onmouseleave = function () { bubble.style.transform = "scale(1)"; };

  var frame = document.createElement("iframe");
  frame.src = baseUrl + "/widget/" + encodeURIComponent(businessId);
  frame.title = "Chat";
  frame.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:360px;height:520px;max-width:calc(100vw - 32px);" +
    "max-height:calc(100vh - 120px);border:none;border-radius:16px;" +
    "box-shadow:0 16px 48px rgba(0,0,0,0.18);z-index:2147483000;display:none;" +
    "background:white;";

  function setOpen(next) {
    open = next;
    frame.style.display = open ? "block" : "none";
    bubble.innerHTML = open
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v11H7l-3 3V4z" stroke="white" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  bubble.addEventListener("click", function () { setOpen(!open); });

  document.body.appendChild(frame);
  document.body.appendChild(bubble);
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
