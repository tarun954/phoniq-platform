(function () {
    const currentScript =
      document.currentScript ||
      Array.from(document.scripts).find((script) =>
        script.src.includes("phoniq-widget.js")
      );
  
    if (!currentScript) return;
  
    const widgetKey = currentScript.getAttribute("data-phoniq-key");
  
    if (!widgetKey) {
      console.error("Phoniq widget: missing data-phoniq-key");
      return;
    }
  
    const scriptUrl = new URL(currentScript.src);
    const baseUrl = scriptUrl.origin;
  
    const root = document.createElement("div");
    root.id = "phoniq-widget-root";
    document.body.appendChild(root);
  
    const style = document.createElement("style");
    style.textContent = `
      #phoniq-widget-root, #phoniq-widget-root * {
        box-sizing: border-box;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
  
      #phoniq-launcher {
        position: fixed;
        right: 22px;
        bottom: 22px;
        width: 58px;
        height: 58px;
        border-radius: 18px;
        border: 0;
        background: #2563eb;
        color: white;
        font-size: 22px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 18px 44px rgba(37,99,235,.30);
        z-index: 2147483646;
      }
  
      #phoniq-panel {
        position: fixed;
        right: 22px;
        bottom: 92px;
        width: min(380px, calc(100vw - 28px));
        max-height: min(650px, calc(100vh - 120px));
        border-radius: 22px;
        overflow: hidden;
        background: white;
        border: 1px solid #e5e7eb;
        box-shadow: 0 28px 80px rgba(15,23,42,.22);
        z-index: 2147483646;
        display: none;
      }
  
      #phoniq-panel.open { display: block; }
  
      .phoniq-widget-header {
        padding: 18px;
        background: #2563eb;
        color: white;
      }
  
      .phoniq-widget-brand {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .12em;
        opacity: .78;
      }
  
      .phoniq-widget-title {
        margin-top: 5px;
        font-size: 17px;
        font-weight: 800;
      }
  
      .phoniq-widget-body {
        padding: 18px;
        overflow: auto;
        max-height: 500px;
      }
  
      .phoniq-message {
        border-radius: 16px;
        padding: 12px 14px;
        font-size: 13px;
        line-height: 1.55;
        background: #f1f5f9;
        color: #334155;
        margin-bottom: 14px;
      }
  
      .phoniq-field { margin-bottom: 12px; }
  
      .phoniq-label {
        display: block;
        margin-bottom: 6px;
        font-size: 11px;
        font-weight: 800;
        color: #475569;
      }
  
      .phoniq-control {
        width: 100%;
        border: 1px solid #dbe2ea;
        border-radius: 12px;
        padding: 11px 12px;
        outline: none;
        font-size: 13px;
        color: #0f172a;
        background: #fff;
      }
  
      .phoniq-control:focus {
        border-color: #93b4ff;
        box-shadow: 0 0 0 3px rgba(37,99,235,.09);
      }
  
      .phoniq-submit {
        width: 100%;
        border: 0;
        border-radius: 12px;
        padding: 12px 14px;
        background: #2563eb;
        color: white;
        font-weight: 800;
        cursor: pointer;
        font-size: 13px;
      }
  
      .phoniq-status {
        margin-top: 12px;
        font-size: 12px;
        line-height: 1.5;
      }
  
      .phoniq-widget-footer {
        padding: 10px 18px 14px;
        font-size: 10px;
        color: #94a3b8;
        text-align: center;
        border-top: 1px solid #f1f5f9;
      }
    `;
    document.head.appendChild(style);
  
    root.innerHTML = `
      <button id="phoniq-launcher" aria-label="Open service chat">P</button>
  
      <div id="phoniq-panel" role="dialog" aria-label="Service request assistant">
        <div class="phoniq-widget-header">
          <div class="phoniq-widget-brand">POWERED BY PHONIQ</div>
          <div class="phoniq-widget-title" id="phoniq-title">Service Assistant</div>
        </div>
  
        <div class="phoniq-widget-body">
          <div class="phoniq-message" id="phoniq-greeting">
            Hi! Tell us what service you need and we'll get your request to the team.
          </div>
  
          <form id="phoniq-form">
            <div class="phoniq-field">
              <label class="phoniq-label">Full name</label>
              <input class="phoniq-control" name="fullName" required placeholder="Your name" />
            </div>
  
            <div class="phoniq-field">
              <label class="phoniq-label">Phone number</label>
              <input class="phoniq-control" name="phone" required placeholder="+1 ..." />
            </div>
  
            <div class="phoniq-field">
              <label class="phoniq-label">City</label>
              <input class="phoniq-control" name="city" placeholder="City" />
            </div>
  
            <div class="phoniq-field">
              <label class="phoniq-label">What service do you need?</label>
              <textarea class="phoniq-control" name="serviceIssue" required rows="3" placeholder="Tell us what is happening"></textarea>
            </div>
  
            <div class="phoniq-field">
              <label class="phoniq-label">Preferred time</label>
              <input class="phoniq-control" name="preferredTime" placeholder="Tomorrow afternoon, Friday 10 AM..." />
            </div>
  
            <button class="phoniq-submit" type="submit">Send service request</button>
  
            <div class="phoniq-status" id="phoniq-status"></div>
          </form>
        </div>
  
        <div class="phoniq-widget-footer">
          AI-assisted lead capture by Phoniq
        </div>
      </div>
    `;
  
    const launcher = root.querySelector("#phoniq-launcher");
    const panel = root.querySelector("#phoniq-panel");
    const form = root.querySelector("#phoniq-form");
    const status = root.querySelector("#phoniq-status");
    const title = root.querySelector("#phoniq-title");
    const greeting = root.querySelector("#phoniq-greeting");
  
    launcher.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  
    fetch(`${baseUrl}/api/widget/config?key=${encodeURIComponent(widgetKey)}`)
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) return;
  
        if (result.widget.displayName) {
          title.textContent = result.widget.displayName;
        }
  
        if (result.widget.greeting) {
          greeting.textContent = result.widget.greeting;
        }
  
        if (result.widget.accentColor) {
          launcher.style.background = result.widget.accentColor;
          root.querySelector(".phoniq-widget-header").style.background =
            result.widget.accentColor;
          root.querySelector(".phoniq-submit").style.background =
            result.widget.accentColor;
        }
      })
      .catch(() => {});
  
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
  
      status.style.color = "#475569";
      status.textContent = "Sending your request...";
  
      const formData = new FormData(form);
  
      const payload = {
        widgetKey,
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        city: formData.get("city"),
        serviceIssue: formData.get("serviceIssue"),
        preferredTime: formData.get("preferredTime"),
      };
  
      try {
        const response = await fetch(`${baseUrl}/api/widget/lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.error || "Unable to send request");
        }
  
        status.style.color = "#15803d";
        status.textContent =
          result.message ||
          "Your request was received. The team will contact you.";
        form.reset();
      } catch (error) {
        status.style.color = "#b91c1c";
        status.textContent =
          error.message ||
          "We couldn't save the request automatically. Please call the business directly.";
      }
    });
  })();
  