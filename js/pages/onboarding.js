// ==========================================================================
// Page Entry: Onboarding Wizard
// Drives the "Set up your Parcera AI" flow end to end. Each step's
// validation and dynamic behaviour lives in its own small section below,
// all coordinated by the shared step/back/continue navigation at the end.
// ==========================================================================

import { qs, qsa, setHidden } from "../utils/dom.js";
import { ICONS } from "../utils/icons.js";
import { renderStepper, WIZARD_STEPS } from "../components/stepper.js";
import { initCustomSelects, refreshCustomSelects } from "../components/customSelect.js";
import { addAddressBlock, getAllAddresses, getLocationOptions, resetAddressBlocks } from "../components/addressBlock.js";
import { renderBusinessHours, getBusinessHoursValue, setBusinessHoursValue } from "../components/businessHours.js";
import { addMenu, getAllMenus, resetMenus, refreshMenuLocationOptions } from "../components/menuUpload.js";
import { saveOnboardingState, loadOnboardingState, clearOnboardingState } from "../utils/onboardingState.js";
import { validators as V, formatters as F, attachValidation } from "../utils/validation.js";
import { markContactVerified, clearVerifiedContacts } from "../utils/verifiedContacts.js";
// FAQs are managed on the Storefront config, not in onboarding.
import { makeCollapsible } from "../components/collapsible.js";
import { initPageTransitions } from "../utils/pageTransition.js";

// Small HTML escape for text dropped into a summary line via innerHTML
function escapeHtml(text) {
  return String(text).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// ---- Static icon injection -------------------------------------------------
function injectStaticIcons() {
  const iconMap = {
    "icon-business": "building",
    "icon-chevron-down": "chevronDown",
    "icon-owner-name": "user",
    "icon-owner-email": "mail",
    "icon-owner-phone": "phone",
    "icon-add-address": "plus",
    "icon-accordion-menu": "chevronDown",
    "icon-accordion-rules": "chevronDown",
    "icon-accordion-hours": "chevronDown",
    "icon-accordion-details": "chevronDown",
    "icon-accordion-pos-business": "chevronDown",
    "icon-accordion-pos-address": "chevronDown",
    "icon-accordion-pos-processing": "chevronDown",
    "icon-accordion-pos-controller": "chevronDown",
    "icon-accordion-pos-owners": "chevronDown",
    "icon-accordion-pos-bank": "chevronDown",
    "icon-accordion-pos-docs": "chevronDown",
    "icon-pos-agreement": "pencil",
    "icon-pos-submit-info": "check",
    "icon-kb-faq": "chat",
    "icon-add-faq": "plus",
    "icon-arrow-4": "arrowRight",
    "icon-chevron-left": "chevronLeft",
    "icon-assistant-name": "user",
    "icon-hint-sparkle": "sparkle",
    "icon-transfer-numbers": "phone",
    "icon-add-transfer": "plus",
    "icon-hint-phone": "phone",
    "icon-choose-voice": "mic",
    "icon-chevron-voice": "chevronDown",
    "icon-languages": "globe",
    "icon-tips": "lightbulb",
    "icon-add-location-banner": "pin",
    "icon-launch-sparkle": "sparkle",
    "icon-launch-success": "partyPopper",
    "icon-launch-phone-chip": "phone",
    // Post-launch "what's next" option cards
    "icon-next-dashboard": "user",
    "icon-next-storefront": "palette",
    "icon-next-arrow-1": "arrowRight",
    "icon-next-arrow-2": "arrowRight",
    "icon-next-add-location": "storefront",
    "icon-next-arrow-3": "arrowRight",
    "icon-digital-suite": "globe",
    // Payment Method step
    "icon-method-card": "creditCard",
    "icon-method-apple": "smartphone",
    "icon-method-google": "smartphone",
    "icon-method-ach": "building",
    "icon-method-card-check": "check",
    "icon-method-apple-check": "check",
    "icon-method-google-check": "check",
    "icon-method-ach-check": "check",
    "icon-card-field": "creditCard",
    "icon-chevron-ach2": "chevronDown",
    "icon-wallet-note": "shield",
    "icon-pay-info": "shield",
    "icon-doc-ring-voided-check": "uploadTray",
    "icon-doc-ring-gov-id": "uploadTray",
    "icon-doc-ring-business-license": "uploadTray",
    "icon-doc-badge-voided-check": "check",
    "icon-doc-badge-gov-id": "check",
    "icon-doc-badge-business-license": "check",
  };

  Object.entries(iconMap).forEach(([id, iconKey]) => {
    const el = qs(`#${id}`);
    if (el) el.innerHTML = ICONS[iconKey];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPageTransitions();
  injectStaticIcons();
  initCustomSelects();

  // ---- Shared chrome -------------------------------------------------------
  const stepperEl = qs("#wizard-stepper");
  const restartLink = qs("#restart-wizard");
  const bottomNav = qs(".wizard-bottom-nav");
  const backButton = qs("#btn-wizard-back");
  const continueButton = qs("#btn-wizard-continue");
  const continueLabelEl = qs(".wizard-bottom-nav__label");
  const wizardSteps = qsa(".wizard-step");

  let currentStepIndex = 0;
  // Steps the user has completed correctly (green in the stepper once left).
  // The furthest step reached governs which badges are clickable.
  const completedSteps = new Set();
  let maxReachedIndex = 0;

  // ======================================================================
  // Step 1: Business Details
  // A single form - no in-wizard contact verification. Whichever contact was
  // already verified at sign-in (see main.js) stays verified; anything typed
  // or changed here is simply collected, not re-checked.
  // ======================================================================
  const businessNameInput = qs("#input-business-name");
  const businessEINInput = qs("#input-business-ein");
  const ownerNameInput = qs("#input-owner-name");
  const ownerEmailInput = qs("#input-owner-email");
  const ownerPhoneInput = qs("#input-owner-phone");
  const smsConsentCheckbox = qs("#checkbox-sms-consent");
  const addressesContainer = qs("#addresses-container");

  // Contact captured on the landing page and passed via the URL, used below
  // to prefill this step's contact fields.
  const landingParams = new URLSearchParams(window.location.search);
  const landingChannel = landingParams.get("channel"); // 'email' | 'phone' | null
  const landingContact = (landingParams.get("contact") || "").trim();

  // The landing contact was already verified on the sign-in page, so record
  // it up front - the dashboard sign-in relies on this to skip its own OTP.
  if ((landingChannel === "email" || landingChannel === "phone") && landingContact) {
    markContactVerified(landingChannel, landingContact);
  }

  // Single location per run (additional locations are onboarded separately).
  addAddressBlock(addressesContainer, { removable: false });

  // Keep Continue's enabled state live as the form is filled
  [businessNameInput, businessEINInput, ownerNameInput, ownerEmailInput, ownerPhoneInput].forEach((input) => {
    input.addEventListener("input", updateContinueState);
  });

  // Live format + red-on-invalid validation for the business fields.
  attachValidation(businessNameInput, { required: true, message: "Business name is required.", onChange: updateContinueState });
  attachValidation(ownerNameInput, { required: true, message: "Contact name is required.", onChange: updateContinueState });
  attachValidation(businessEINInput, { validate: V.ein, format: F.ein, required: true, message: "Use the format 12-3456789.", onChange: updateContinueState });
  attachValidation(ownerEmailInput, { validate: V.email, message: "Enter a valid email address.", onChange: updateContinueState });
  attachValidation(ownerPhoneInput, { validate: V.phone, format: F.phone, message: "Enter a valid phone number.", onChange: updateContinueState });

  // Consent is required to continue; reflect that state live.
  smsConsentCheckbox.addEventListener("change", updateContinueState);

  // The core required fields for the details form. Every field must match
  // its stated format, at least one contact must be present + valid, and the
  // SMS consent box must be checked before this step can be completed.
  function businessFormComplete() {
    if (!V.required(businessNameInput.value) || !V.required(ownerNameInput.value)) return false;
    if (!V.ein(businessEINInput.value)) return false;

    const email = ownerEmailInput.value.trim();
    const phone = ownerPhoneInput.value.trim();
    if (!email && !phone) return false;
    if (email && !V.email(email)) return false;
    if (phone && !V.phone(phone)) return false;

    if (!smsConsentCheckbox.checked) return false;
    return true;
  }

  // ======================================================================
  // Step: Knowledge Base
  // Operating hours, restaurant details, accepted payment methods, and a
  // repeatable FAQ list. All optional, so it never blocks Continue.
  // ======================================================================
  const kbHoursContainer = qs("#kb-hours-container");
  const kbMenusContainer = qs("#kb-menus-container");
  // Free-text Knowledge Base fields (all carried across onboardings)
  const kbTextInputs = {
    dietary: qs("#kb-dietary"),
    allergens: qs("#kb-allergens"),
    kids: qs("#kb-kids"),
    parking: qs("#kb-parking"),
    about: qs("#kb-about"),
  };

  renderBusinessHours(kbHoursContainer);

  // Accordions behave as one exclusive group per wizard step: opening one
  // collapses the others in the same step (Knowledge Base: Menu -> Ordering
  // Rules -> More details, one open at a time). Closing the open one leaves
  // all collapsed. The Menu ships open (see markup).
  // Height is measured (scrollHeight), not a fixed oversized cap, so a
  // 3-field section and a 10-field section both animate over the same
  // duration instead of the short one finishing almost instantly. Once an
  // opened body settles it's released to max-height: none so content added
  // afterward (e.g. another Beneficial Owner card) isn't clipped by a
  // height measured before it existed.
  function setAccordionOpen(acc, open) {
    const toggle = acc.querySelector("[data-role='accordion-toggle']");
    const body = acc.querySelector("[data-role='accordion-body']");
    if (!toggle || !body) return;
    if (open) {
      body.classList.remove("is-collapsed");
      body.style.maxHeight = `${body.scrollHeight}px`;
      body.addEventListener("transitionend", function onOpenEnd(e) {
        if (e.target !== body || e.propertyName !== "max-height") return;
        body.removeEventListener("transitionend", onOpenEnd);
        if (!body.classList.contains("is-collapsed")) body.style.maxHeight = "none";
      });
    } else {
      // Pin to the current rendered height first (an open body may be
      // sitting at max-height: none by now) so there's a real value to
      // transition FROM rather than jumping straight to 0.
      body.style.maxHeight = `${body.scrollHeight}px`;
      void body.offsetHeight; // force layout so the pinned height commits before collapsing
      body.classList.add("is-collapsed");
      body.style.maxHeight = "0px";
    }
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  qsa(".accordion").forEach((acc) => {
    const toggle = acc.querySelector("[data-role='accordion-toggle']");
    const body = acc.querySelector("[data-role='accordion-body']");
    if (!toggle || !body) return;
    if (!body.classList.contains("is-collapsed")) body.style.maxHeight = "none";
    toggle.addEventListener("click", () => {
      const willOpen = body.classList.contains("is-collapsed");
      if (willOpen) {
        // Collapse sibling accordions in the same step before opening this one
        const scope = acc.closest(".wizard-step") || document;
        qsa(".accordion", scope).forEach((other) => {
          if (other !== acc) setAccordionOpen(other, false);
        });
      }
      setAccordionOpen(acc, willOpen);
    });
  });

  // Single menu per location - one non-removable card that link-fetch, upload,
  // and manual entry all feed into.
  addMenu(kbMenusContainer, { removable: false, locations: getLocationOptions() });

  // Collects the accepted payment methods from the chip checkboxes
  function getKbPaymentMethods() {
    return qsa("#kb-payment-methods input:checked").map((cb) => cb.value);
  }

  // Default chips (matches the checked state in the markup)
  const DEFAULT_KB_PAYMENTS = ["Visa", "Mastercard", "Cash"];

  // Sets which payment chips are checked (used by carry-over restore + reset)
  function setKbPaymentMethods(values) {
    const set = new Set(values || []);
    qsa("#kb-payment-methods input[type='checkbox']").forEach((cb) => {
      cb.checked = set.has(cb.value);
    });
  }

  // ======================================================================
  // Step 2: Service Setup
  // Multi-select: any number of Parcera services can be added at once, each
  // with its own pricing tier. Reservations additionally reveals a nested
  // "which system manages your tables" choice once it's selected.
  // ======================================================================
  const serviceTilesContainer = qs("#service-tiles-container");

  // Single-select: a location runs ONE product - reservation (Toast/Parcera) OR
  // ordering (via Parcera POS). Matches what the backend supports today.
  const SERVICES = [
    {
      id: "ordering",
      label: "Parcera Ordering",
      icon: "cart",
      description: "One AI-powered ordering system across every channel your customers use.",
      channels: ["Voice AI Ordering", "Online Ordering", "Mobile Ordering"],
      tiers: [
        { name: "Starter", price: 9.99, blurb: "Answers calls and logs orders straight into your POS." },
        { name: "Growth", price: 99, blurb: "Live order routing with automatic upsell prompts." },
        { name: "Pro", price: 199, blurb: "Multi-line support with real-time order sync across your systems." },
      ],
    },
    {
      id: "reservations",
      label: "Parcera Reservations",
      icon: "calendar",
      description: "Voice AI answers calls and books appointments - via Parcera Tables or your existing Toast Tables.",
      tiers: [
        { name: "Starter", price: 9.99, blurb: "Answers booking calls with email confirmations." },
        { name: "Growth", price: 99, blurb: "Adds SMS reminders, waitlists, and appointment assignments." },
        { name: "Pro", price: 199, blurb: "Multi-location sync plus priority phone support." },
      ],
    },
    {
      id: "pos",
      label: "Parcera PoS",
      icon: "creditCard",
      description: "A point-of-sale built into your Parcera plan, for taking payments in person or online.",
      tiers: [
        { name: "Per Transaction", price: 30, priceLabel: "$30/mo", blurb: "3% + 15 cents per transaction, plus a $30 monthly fee." },
        { name: "Zero Cost", price: 0, priceLabel: "$0/mo", blurb: "No monthly fee or per-transaction cost to you - customers pay a 3.5% surcharge instead." },
        { name: "Custom", price: 0, priceLabel: "Custom", blurb: "Call sales for a quote tailored to your business." },
      ],
    },
  ];

  // { [serviceId]: { tierIndex, management, toastLink } } - only present
  // for services the user has actually added. The single source of truth
  // for the Service Setup tiles, the Payment breakdown, and the Review rows.
  let selectedServices = {};
  const tilePainters = {}; // serviceId -> repaint function, so any code that
                            // mutates selectedServices can re-sync the tiles

  function getService(id) {
    return SERVICES.find((s) => s.id === id);
  }

  function serviceTotal() {
    return Object.entries(selectedServices).reduce((sum, [id, sel]) => {
      const svc = getService(id);
      return sum + (svc ? svc.tiers[sel.tierIndex].price : 0);
    }, 0);
  }

  function tileTemplate(svc) {
    return `
      <div class="service-tile" data-service="${svc.id}">
        <div class="service-tile__header">
          <span class="service-tile__icon">${ICONS[svc.icon]}</span>
          <div class="service-tile__heading">
            <div class="service-tile__title">${svc.label}</div>
            <div class="service-tile__description">${svc.description}</div>
          </div>
          <button type="button" class="service-tile__remove is-hidden" data-role="remove-service">${ICONS.close} Remove</button>
        </div>
        ${svc.channels ? `
          <div class="service-tile__channels">
            ${svc.channels.map((c) => `<span class="pill pill--channel">${c}</span>`).join("")}
          </div>
        ` : ""}
        <div class="tier-options">
          ${svc.tiers.map((t, i) => `
            <button type="button" class="tier-option" data-tier-index="${i}">
              <span class="tier-option__top">
                <span class="tier-option__name">${t.name}</span>
                <span class="tier-option__price">${t.priceLabel || `$${t.price}/mo`}</span>
              </span>
              <span class="tier-option__blurb">${t.blurb}</span>
            </button>
          `).join("")}
        </div>
        ${svc.id === "reservations" ? `
          <div class="service-tile__subfields is-hidden" data-role="reservations-subfields">
            <div class="field-group" style="margin-top: 0;">
              <label class="field-group__label">Management System</label>
              <div class="select-field">
                <select class="select-field__control" data-role="management-select">
                  <option value="parcera">Parcera Tables</option>
                  <option value="toast">Toast Tables</option>
                </select>
                <span class="select-field__chevron">${ICONS.chevronDown}</span>
              </div>
            </div>
            <div class="field-group is-hidden" data-role="toast-link-group">
              <label class="field-group__label">Toast Tables Link</label>
              <div class="input-field">
                <input class="input-field__control" style="padding-left: var(--space-4);" type="url" data-role="toast-link" placeholder="https://www.toasttab.com/your-business" />
              </div>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // Wires one tile's interactions and registers its repaint function
  function wireServiceTile(svc) {
    const tile = serviceTilesContainer.querySelector(`[data-service="${svc.id}"]`);
    const tierButtons = Array.from(tile.querySelectorAll(".tier-option"));
    const removeBtn = tile.querySelector('[data-role="remove-service"]');
    const subfields = tile.querySelector('[data-role="reservations-subfields"]');
    const managementSelect = tile.querySelector('[data-role="management-select"]');
    const toastLinkGroup = tile.querySelector('[data-role="toast-link-group"]');
    const toastLinkInput = tile.querySelector('[data-role="toast-link"]');

    function paint() {
      const sel = selectedServices[svc.id];
      tile.classList.toggle("is-selected", !!sel);
      setHidden(removeBtn, !sel);
      tierButtons.forEach((btn, i) => btn.classList.toggle("is-selected", !!sel && sel.tierIndex === i));
      if (subfields) setHidden(subfields, !sel);
      if (managementSelect) {
        managementSelect.value = (sel && sel.management) || "parcera";
        if (toastLinkGroup) setHidden(toastLinkGroup, managementSelect.value !== "toast");
        if (toastLinkInput) toastLinkInput.value = (sel && sel.toastLink) || "";
        // Setting .value directly bypasses the custom-select's own click path,
        // so sync its visible label (e.g. after remove + re-add resets to default)
        refreshCustomSelects();
      }
    }
    tilePainters[svc.id] = paint;

    tierButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const current = selectedServices[svc.id];
        if (current && current.tierIndex === i) {
          delete selectedServices[svc.id]; // clicking the active tier again removes the product
        } else {
          // Single-select: one product per location - drop any other product first.
          Object.keys(selectedServices).forEach((k) => { if (k !== svc.id) delete selectedServices[k]; });
          selectedServices[svc.id] = current
            ? { ...current, tierIndex: i }
            : { tierIndex: i, management: "parcera", toastLink: "" };
        }
        syncServiceTiles(); // repaint ALL tiles since the other product may have been cleared
        onServiceSelectionChange();
      });
    });

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        delete selectedServices[svc.id];
        paint();
        onServiceSelectionChange();
      });
    }

    if (managementSelect) {
      managementSelect.addEventListener("change", () => {
        const sel = selectedServices[svc.id];
        if (!sel) return;
        sel.management = managementSelect.value;
        setHidden(toastLinkGroup, sel.management !== "toast");
        updateContinueState();
      });
    }

    if (toastLinkInput) {
      toastLinkInput.addEventListener("input", () => {
        const sel = selectedServices[svc.id];
        if (sel) sel.toastLink = toastLinkInput.value;
        updateContinueState();
      });
      attachValidation(toastLinkInput, { validate: V.url, message: "Enter a valid https:// link.", onChange: updateContinueState });
    }
  }

  function renderServiceTiles() {
    serviceTilesContainer.innerHTML = SERVICES.map(tileTemplate).join("");
    SERVICES.forEach(wireServiceTile);
    initCustomSelects(serviceTilesContainer);
    SERVICES.forEach((svc) => tilePainters[svc.id]());
  }

  // Re-paints every tile from `selectedServices` - used after a carry-over
  // restore, or after removing a service from the Review summary
  function syncServiceTiles() {
    SERVICES.forEach((svc) => tilePainters[svc.id] && tilePainters[svc.id]());
    refreshCustomSelects();
  }

  // Digital Storefront is a free branded website, included with the plan. Its
  // toggle is a real control the merchant owns: ON by default, but they can
  // turn it off if they don't want the storefront.
  const digitalSuiteTile = qs("#digital-suite-tile");
  const digitalSuiteToggle = qs("#digital-suite-toggle");
  const digitalStorefront = { enabled: true };

  // Reflects the current enabled state onto the toggle + tile styling.
  function syncDigitalSuiteToggle() {
    if (digitalSuiteToggle) digitalSuiteToggle.checked = digitalStorefront.enabled;
    if (digitalSuiteTile) digitalSuiteTile.classList.toggle("is-selected", digitalStorefront.enabled);
  }
  if (digitalSuiteToggle) {
    digitalSuiteToggle.addEventListener("change", () => {
      digitalStorefront.enabled = digitalSuiteToggle.checked;
      syncDigitalSuiteToggle();
    });
  }

  // Keeps the Payment breakdown (and Continue button) in sync with whatever
  // just changed in the tiles
  function onServiceSelectionChange() {
    updateContinueState();
    renderPlanBreakdown();
    refreshStepper();
  }

  renderServiceTiles();
  syncDigitalSuiteToggle();

  // ── Dynamic service rules: ordering-rules OR reservation-rules, rendered on
  //    the Restaurant Details step from the product chosen on the previous step. ──
  const serviceRulesFields = qs("#service-rules-fields");
  const serviceRulesHeading = qs("#service-rules-heading");
  const serviceRulesMeta = qs("#service-rules-meta");
  function selectedAgentKind() {
    if (selectedServices.ordering) return "ordering";
    if (selectedServices.reservations) return "reservation";
    return null;
  }
  const ruleRow = (id, label, value, { min = 0, max, step, hint } = {}) => `
    <div class="field-group">
      <label class="field-group__label" for="${id}">${label}</label>
      <div class="input-field">
        <input class="input-field__control" style="padding-left: var(--space-4);" type="number" id="${id}"
          value="${value}" min="${min}"${max != null ? ` max="${max}"` : ""}${step ? ` step="${step}"` : ""} />
      </div>
      ${hint ? `<p class="field-group__hint">${hint}</p>` : ""}
    </div>`;
  function orderingRulesTemplate() {
    return `
      <div class="field-group" style="margin-top: 0;">
        <label class="field-group__label">Supported order types</label>
        <div class="kb-chips" id="rule-order-types">
          <label class="kb-chip"><input type="checkbox" value="pickup" checked /><span>Pickup</span></label>
          <label class="kb-chip"><input type="checkbox" value="delivery" /><span>Delivery</span></label>
        </div>
      </div>
      <div class="rules-grid">
        ${ruleRow("rule-min-order", "Minimum order ($)", "0", { step: "0.01" })}
        ${ruleRow("rule-max-items", "Max items per order", "20", { min: 1, hint: "Total items in one order - stops abusive orders (e.g. 100 bagels)." })}
        ${ruleRow("rule-max-qty", "Max quantity per item", "25", { min: 1, hint: "Most of any single item in one order." })}
        ${ruleRow("rule-prep", "Estimated prep (min)", "15", { min: 0 })}
      </div>
      <div class="rules-note">
        <span class="rules-note__icon">${ICONS.shield}</span>
        <span>These are safety fallbacks. Your agent enforces them as hard caps so customers can't place abusive orders.</span>
      </div>`;
  }
  function reservationRulesTemplate() {
    return `
      <div class="rules-grid">
        ${ruleRow("rule-min-party", "Min party size", "1", { min: 1 })}
        ${ruleRow("rule-max-party", "Max party size", "20", { min: 1, max: 200, hint: "Hard cap (up to 200)." })}
        ${ruleRow("rule-advance", "Advance booking (days)", "30", { min: 0 })}
        ${ruleRow("rule-lead", "Lead time (min)", "60", { min: 0 })}
        ${ruleRow("rule-large-party", "Large party threshold", "6", { min: 1 })}
        ${ruleRow("rule-cutoff", "Same-day cutoff (min)", "120", { min: 0 })}
      </div>
      <div class="rules-note">
        <span class="rules-note__icon">${ICONS.shield}</span>
        <span>Your agent enforces these on every booking. Bookings past these limits are declined or held for approval.</span>
      </div>`;
  }
  function renderServiceRules() {
    if (!serviceRulesFields) return;
    const kind = selectedAgentKind();
    if (kind === "ordering") {
      serviceRulesHeading.textContent = "Ordering Rules";
      serviceRulesMeta.textContent = "Safety limits your agent enforces so no one can place an abusive order.";
      serviceRulesFields.innerHTML = orderingRulesTemplate();
    } else if (kind === "reservation") {
      serviceRulesHeading.textContent = "Reservation Rules";
      serviceRulesMeta.textContent = "Booking limits your agent enforces on every reservation.";
      serviceRulesFields.innerHTML = reservationRulesTemplate();
    } else {
      serviceRulesHeading.textContent = "Service Rules";
      serviceRulesMeta.textContent = "Choose a product on the previous step to configure its rules.";
      serviceRulesFields.innerHTML = `<p class="field-group__hint">No product selected yet - go back and pick your product.</p>`;
    }
  }

  // At least one service must be selected. The Toast Tables link (like the
  // rest of this field) is optional - it just flags red if something
  // invalid is typed, it doesn't block Continue when left empty.
  function integrationComplete() {
    const ids = Object.keys(selectedServices);
    return ids.length > 0;
  }

  // ======================================================================
  // Step 5: Voice & Greeting Setup
  // ======================================================================
  const assistantNameInput = qs("#input-assistant-name");
  const voiceSelect = qs("#input-voice-select");
  const spanishCheckbox = qs("#checkbox-spanish");
  const transferRulesContainer = qs("#transfer-rules-container");
  const addTransferButton = qs("#btn-add-transfer");
  const greetingsContainer = qs("#greetings-container");

  let transferRuleCount = 0;
  const GREETING_MAX_LENGTH = 300;
  const greetingDirty = {}; // tracks which languages the user has hand-edited

  function addTransferRule(prefill) {
    transferRuleCount += 1;
    const ruleNumber = transferRuleCount;

    // Adding a new rule folds the existing ones to their summary line
    transferRulesContainer.querySelectorAll(".transfer-rule").forEach((el) => {
      if (el._collapsible) el._collapsible.collapse();
    });

    const wrapper = document.createElement("div");
    wrapper.className = "transfer-rule";
    wrapper.dataset.ruleNumber = String(ruleNumber);
    wrapper.innerHTML = `
      <div class="transfer-rule__head">
        <div class="transfer-rule__title">Transfer Rule #${ruleNumber}</div>
        <button type="button" class="transfer-rule__remove" data-role="remove-transfer" aria-label="Remove transfer rule">
          ${ICONS.close}
        </button>
      </div>
      <div class="transfer-rule__body">
        <div class="transfer-rule__row">
          <div>
            <label class="field-group__label">Label</label>
            <div class="input-field">
              <input class="input-field__control transfer-label" style="padding-left: var(--space-4);" type="text" placeholder="e.g., General" value="${prefill?.label || ""}" />
            </div>
          </div>
          <div>
            <label class="field-group__label">Phone Number</label>
            <div class="input-field">
              <span class="input-field__icon">${ICONS.phone}</span>
              <input class="input-field__control transfer-phone" type="tel" placeholder="(555) 123-4567" value="${prefill?.phone || ""}" />
            </div>
          </div>
        </div>
        <div class="field-group transfer-rule__field">
          <label class="field-group__label">Transfer Condition</label>
          <div class="input-field">
            <textarea class="input-field__control transfer-rule__condition" placeholder="When should the AI transfer this call?">${prefill?.condition || ""}</textarea>
          </div>
        </div>
        <div class="field-group transfer-rule__field">
          <label class="field-group__label">Transfer Type</label>
          <div class="select-field">
            <select class="select-field__control">
              <option>Blind (AI disconnects)</option>
              <option>Warm (AI stays on the line)</option>
            </select>
            <span class="select-field__chevron">${ICONS.chevronDown}</span>
          </div>
        </div>
      </div>
    `;
    transferRulesContainer.appendChild(wrapper);

    const labelInput = wrapper.querySelector(".transfer-label");
    const phoneInput = wrapper.querySelector(".transfer-phone");
    wrapper._collapsible = makeCollapsible(wrapper, {
      header: wrapper.querySelector(".transfer-rule__head"),
      titleEl: wrapper.querySelector(".transfer-rule__title"),
      body: wrapper.querySelector(".transfer-rule__body"),
      ignore: "[data-role='remove-transfer']",
      getSummary: () => {
        const label = labelInput.value.trim();
        const phone = phoneInput.value.trim();
        if (!label && !phone) return "<em>New transfer number</em>";
        return `${escapeHtml(label || "Transfer")}${phone ? " · " + escapeHtml(phone) : ""}`;
      },
    });

    labelInput.addEventListener("input", updateContinueState);
    phoneInput.addEventListener("input", updateContinueState);
    attachValidation(phoneInput, { validate: V.phone, format: F.phone, message: "Enter a valid phone number.", onChange: updateContinueState });

    // Remove button always present, but the last remaining rule can't be
    // removed so the step always keeps at least one transfer number.
    wrapper.querySelector('[data-role="remove-transfer"]').addEventListener("click", () => {
      if (transferRulesContainer.querySelectorAll(".transfer-rule").length <= 1) return;
      wrapper.remove();
      updateTransferRemoveState();
      updateContinueState();
    });

    // The Transfer Type <select> above is created fresh here, after the
    // page's one-time initCustomSelects() already ran enhance just this
    // instance so it gets the same custom dropdown styling as the rest.
    initCustomSelects(wrapper);
    updateTransferRemoveState();
  }

  // Hide the remove control when only one rule remains, show it otherwise
  function updateTransferRemoveState() {
    const rules = transferRulesContainer.querySelectorAll(".transfer-rule");
    rules.forEach((rule) => {
      const btn = rule.querySelector('[data-role="remove-transfer"]');
      if (btn) setHidden(btn, rules.length <= 1);
    });
  }

  addTransferButton.addEventListener("click", () => addTransferRule());

  // Renders one greeting textarea per currently-enabled language
  function renderGreetings() {
    const assistantName = assistantNameInput.value.trim() || "your assistant";
    const languages = [{ code: "english", label: "English", required: true }];
    if (spanishCheckbox.checked) languages.push({ code: "spanish", label: "Spanish", required: false });

    const existingValues = {};
    qsa(".greeting-textarea", greetingsContainer).forEach((el) => {
      if (greetingDirty[el.dataset.lang]) existingValues[el.dataset.lang] = el.value;
    });

    greetingsContainer.innerHTML = languages
      .map((lang) => {
        const defaultText =
          lang.code === "english"
            ? `Welcome to ${assistantName}! How can I help you today?`
            : `¡Bienvenido a ${assistantName}! ¿En qué puedo ayudarte hoy?`;
        const value = existingValues[lang.code] ?? defaultText;
        return `
          <div class="wizard-section" style="margin-bottom: var(--space-5);" data-lang-section="${lang.code}">
            <div class="wizard-section__header">
              <span class="wizard-section__icon">${ICONS.chat}</span>
              <div>
                <div class="wizard-section__heading">${lang.label} Greeting</div>
                <div class="wizard-section__heading-meta">First words ${lang.label}-speaking callers will hear</div>
              </div>
            </div>
            <label class="field-group__label">Greeting Message</label>
            <div class="textarea-wrapper">
              <textarea class="input-field__control greeting-textarea" data-lang="${lang.code}" maxlength="${GREETING_MAX_LENGTH}">${value}</textarea>
              <span class="textarea-wrapper__counter">${GREETING_MAX_LENGTH - value.length}</span>
            </div>
          </div>
        `;
      })
      .join("");

    qsa(".greeting-textarea", greetingsContainer).forEach((el) => {
      el.addEventListener("input", () => {
        greetingDirty[el.dataset.lang] = true;
        const counter = el.parentElement.querySelector(".textarea-wrapper__counter");
        counter.textContent = GREETING_MAX_LENGTH - el.value.length;
        updateContinueState();
      });
    });
  }

  function getFirstGreetingText() {
    const englishArea = greetingsContainer.querySelector('[data-lang="english"]');
    return englishArea ? englishArea.value.trim() : "";
  }

  assistantNameInput.addEventListener("input", () => {
    renderGreetings();
    updateContinueState();
  });
  spanishCheckbox.addEventListener("change", renderGreetings);
  voiceSelect.addEventListener("change", updateContinueState);

  // ======================================================================
  // Steps: Parcera PoS payment setup - Business & Processing Profile,
  // Owners & Bank Account, Documents & Agreement. Only relevant when
  // Parcera PoS is the selected product; all three steps are skipped
  // entirely otherwise (see stepSkipped()/refreshStepper() further down).
  // ======================================================================
  function isPosSelected() {
    return !!selectedServices.pos;
  }

  const US_STATES = [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
    ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
    ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
    ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
    ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
    ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
    ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
    ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
    ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
    ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
    ["WY", "Wyoming"],
  ];
  // Custom-select rebuilds its option list live on every open() (see
  // customSelect.js), so populating a native <select> after enhancement is
  // safe - no need to worry about init ordering here.
  function populateStateSelects(root = document) {
    qsa(".state-select", root).forEach((select) => {
      if (select.dataset.populated === "true") return;
      select.dataset.populated = "true";
      US_STATES.forEach(([code, name]) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = `${name} (${code})`;
        select.appendChild(opt);
      });
    });
  }
  populateStateSelects();

  // ---- Business & Processing Profile ----
  const posLegalName = qs("#pos-legal-name");
  const posEin = qs("#pos-ein");
  const posEntityType = qs("#pos-entity-type");
  const posStateIncorporated = qs("#pos-state-incorporated");
  const posNature = qs("#pos-nature");
  const posSicMcc = qs("#pos-sic-mcc");
  const posYearsInBusiness = qs("#pos-years-in-business");
  const posContactName = qs("#pos-contact-name");
  const posLegalAddress = qs("#pos-legal-address");
  const posLegalCity = qs("#pos-legal-city");
  const posLegalState = qs("#pos-legal-state");
  const posLegalZip = qs("#pos-legal-zip");
  const posLegalPhone = qs("#pos-legal-phone");
  const posDbaName = qs("#pos-dba-name");
  const posDbaAddress = qs("#pos-dba-address");
  const posDbaCity = qs("#pos-dba-city");
  const posDbaZip = qs("#pos-dba-zip");
  const posDbaPhone = qs("#pos-dba-phone");
  const posDbaEmail = qs("#pos-dba-email");
  const posAvgTicket = qs("#pos-avg-ticket");
  const posHighTicket = qs("#pos-high-ticket");

  // The DBA fields only matter once there's actually a DBA (a name different
  // from the legal business name) - otherwise they're all optional.
  function dbaNameFilled() {
    return !!posDbaName.value.trim();
  }

  attachValidation(posLegalName, { required: true, message: "Legal business name is required.", onChange: updateContinueState });
  attachValidation(posEin, { validate: V.ein, format: F.ein, required: true, message: "Use the format 12-3456789.", onChange: updateContinueState });
  attachValidation(posSicMcc, { format: (v) => v.replace(/\D/g, "").slice(0, 4), message: "4-digit code.", onChange: updateContinueState });
  attachValidation(posYearsInBusiness, { required: true, message: "Years in business is required.", onChange: updateContinueState });
  attachValidation(posContactName, { required: true, message: "Contact name is required.", onChange: updateContinueState });
  attachValidation(posLegalAddress, { required: true, message: "Address is required.", onChange: updateContinueState });
  attachValidation(posLegalCity, { required: true, message: "City is required.", onChange: updateContinueState });
  attachValidation(posLegalZip, { validate: V.zip, format: F.zip, required: true, message: "Enter a valid ZIP.", onChange: updateContinueState });
  attachValidation(posLegalPhone, { validate: V.phone, format: F.phone, required: true, message: "Enter a valid phone number.", onChange: updateContinueState });
  attachValidation(posDbaAddress, { required: dbaNameFilled, message: "Address is required when a DBA name is entered.", onChange: updateContinueState });
  attachValidation(posDbaCity, { required: dbaNameFilled, message: "City is required when a DBA name is entered.", onChange: updateContinueState });
  attachValidation(posDbaZip, { validate: V.zip, format: F.zip, required: dbaNameFilled, message: "Enter a valid ZIP.", onChange: updateContinueState });
  attachValidation(posDbaPhone, { validate: V.phone, format: F.phone, required: dbaNameFilled, message: "Enter a valid phone number.", onChange: updateContinueState });
  attachValidation(posDbaEmail, { validate: V.email, required: dbaNameFilled, message: "Enter a valid email address.", onChange: updateContinueState });
  attachValidation(posAvgTicket, { required: true, message: "Average ticket is required.", onChange: updateContinueState });
  attachValidation(posHighTicket, { required: true, message: "High ticket is required.", onChange: updateContinueState });

  [posEntityType, posStateIncorporated, posLegalState].forEach((el) => el.addEventListener("change", updateContinueState));

  // These fields already exist on the main Business Details step, so they're
  // copied straight in here rather than making the merchant retype them -
  // but only until the merchant actually edits them on this step themselves.
  // Legal/DBA Address isn't included: Business Details only captures one
  // free-text address line, not separate street/city/state/ZIP, and there's
  // no reliable way to split that line into this step's structured fields.
  let posNatureTouched = false;
  let posContactNameTouched = false;
  let posLegalNameTouched = false;
  let posEinTouched = false;
  let posLegalPhoneTouched = false;
  posNature.addEventListener("change", () => { posNatureTouched = true; updateContinueState(); });
  posContactName.addEventListener("input", () => { posContactNameTouched = true; });
  posLegalName.addEventListener("input", () => { posLegalNameTouched = true; });
  posEin.addEventListener("input", () => { posEinTouched = true; });
  posLegalPhone.addEventListener("input", () => { posLegalPhoneTouched = true; });
  function syncPosBusinessDefaults() {
    if (!posNatureTouched && businessTypeInput.value) {
      const hasMatch = [...posNature.options].some((o) => o.value === businessTypeInput.value);
      if (hasMatch) posNature.value = businessTypeInput.value;
    }
    if (!posContactNameTouched && !posContactName.value.trim() && ownerNameInput.value.trim()) {
      posContactName.value = ownerNameInput.value;
    }
    if (!posLegalNameTouched && !posLegalName.value.trim() && businessNameInput.value.trim()) {
      posLegalName.value = businessNameInput.value;
    }
    if (!posEinTouched && !posEin.value.trim() && businessEINInput.value.trim()) {
      posEin.value = businessEINInput.value;
    }
    if (!posLegalPhoneTouched && !posLegalPhone.value.trim() && ownerPhoneInput.value.trim()) {
      posLegalPhone.value = ownerPhoneInput.value;
    }
    refreshCustomSelects();
  }

  // Not gated - the merchant can move on and fill this in later. Per-field
  // validation above still flags a malformed value, it just doesn't block
  // Continue.
  function posBusinessComplete() {
    return true;
  }

  // ---- Owners & Bank Account ----
  const posControllerSsn = qs("#pos-controller-ssn");
  const posControllerAddress = qs("#pos-controller-address");
  const posControllerCity = qs("#pos-controller-city");
  const posControllerState = qs("#pos-controller-state");
  const posControllerZip = qs("#pos-controller-zip");
  const posControllerPhone = qs("#pos-controller-phone");
  const posControllerEmail = qs("#pos-controller-email");
  const posOwnersContainer = qs("#pos-owners-container");
  const addOwnerButton = qs("#btn-add-owner");
  const posBankName = qs("#pos-bank-name");
  const posBankRouting = qs("#pos-bank-routing");
  const posBankAccount = qs("#pos-bank-account");

  attachValidation(posControllerSsn, { validate: V.ssn, format: F.ssn, required: true, message: "Use the format 600-12-3456.", onChange: updateContinueState });
  attachValidation(posControllerAddress, { required: true, message: "Address is required.", onChange: updateContinueState });
  attachValidation(posControllerCity, { required: true, message: "City is required.", onChange: updateContinueState });
  attachValidation(posControllerZip, { validate: V.zip, format: F.zip, required: true, message: "Enter a valid ZIP.", onChange: updateContinueState });
  attachValidation(posControllerPhone, { validate: V.phone, format: F.phone, required: true, message: "Enter a valid phone number.", onChange: updateContinueState });
  attachValidation(posControllerEmail, { validate: V.email, message: "Enter a valid email address.", onChange: updateContinueState });
  posControllerState.addEventListener("change", updateContinueState);

  // The controller is usually the same person as the main business contact,
  // so default their phone/email from Business Details too - until edited here.
  let posControllerPhoneTouched = false;
  let posControllerEmailTouched = false;
  posControllerPhone.addEventListener("input", () => { posControllerPhoneTouched = true; });
  posControllerEmail.addEventListener("input", () => { posControllerEmailTouched = true; });
  function syncPosOwnersDefaults() {
    if (!posControllerPhoneTouched && !posControllerPhone.value.trim() && ownerPhoneInput.value.trim()) {
      posControllerPhone.value = ownerPhoneInput.value;
    }
    if (!posControllerEmailTouched && !posControllerEmail.value.trim() && ownerEmailInput.value.trim()) {
      posControllerEmail.value = ownerEmailInput.value;
    }
  }

  attachValidation(posBankName, { required: true, message: "Name on account is required.", onChange: updateContinueState });
  attachValidation(posBankRouting, { validate: V.routing, format: F.routing, required: true, message: "9-digit routing number.", onChange: updateContinueState });
  attachValidation(posBankAccount, { validate: V.account, format: F.account, required: true, message: "Enter a valid account number.", onChange: updateContinueState });

  const MAX_BENEFICIAL_OWNERS = 4;
  let ownerCount = 0;

  // One repeatable, collapsible owner card - same shape as Voice AI's
  // Transfer Rules (reuses .transfer-rule/.transfer-rule__* for free styling
  // and the same makeCollapsible pattern), capped at 4 beneficial owners.
  function addBeneficialOwner() {
    if (ownerCount >= MAX_BENEFICIAL_OWNERS) return;
    ownerCount += 1;
    const ownerNumber = ownerCount;

    posOwnersContainer.querySelectorAll(".transfer-rule").forEach((el) => {
      if (el._collapsible) el._collapsible.collapse();
    });

    const wrapper = document.createElement("div");
    wrapper.className = "transfer-rule";
    wrapper.dataset.ownerNumber = String(ownerNumber);
    wrapper.innerHTML = `
      <div class="transfer-rule__head">
        <div class="transfer-rule__title">Owner ${ownerNumber}</div>
        <button type="button" class="transfer-rule__remove" data-role="remove-owner" aria-label="Remove owner">${ICONS.close}</button>
      </div>
      <div class="transfer-rule__body">
        <div class="pay-fields__row pay-fields__row--two">
          <div class="field-group" style="margin-top: 0;">
            <label class="field-group__label">First Name *</label>
            <div class="input-field"><input class="input-field__control owner-first-name" style="padding-left: var(--space-4);" type="text" placeholder="e.g., John" /></div>
          </div>
          <div class="field-group" style="margin-top: 0;">
            <label class="field-group__label">Last Name *</label>
            <div class="input-field"><input class="input-field__control owner-last-name" style="padding-left: var(--space-4);" type="text" placeholder="e.g., Doe" /></div>
          </div>
        </div>
        <div class="pay-fields__row pay-fields__row--two">
          <div class="field-group">
            <label class="field-group__label">Title *</label>
            <div class="select-field">
              <select class="select-field__control owner-title">
                <option value="">Select...</option>
                <option>Owner</option>
                <option>CEO</option>
                <option>CFO</option>
                <option>President</option>
                <option>Managing Member</option>
                <option>Partner</option>
                <option>Other</option>
              </select>
              <span class="select-field__chevron">${ICONS.chevronDown}</span>
            </div>
          </div>
          <div class="field-group">
            <label class="field-group__label">Ownership % *</label>
            <div class="input-field"><input class="input-field__control owner-ownership" style="padding-left: var(--space-4);" type="number" min="0" max="100" placeholder="e.g., 100" /></div>
          </div>
        </div>
        <div class="pay-fields__row pay-fields__row--two">
          <div class="field-group">
            <label class="field-group__label">Date of Birth *</label>
            <div class="input-field"><input class="input-field__control owner-dob" style="padding-left: var(--space-4);" type="text" placeholder="MM/DD/YYYY" inputmode="numeric" maxlength="10" /></div>
          </div>
          <div class="field-group">
            <label class="field-group__label">SSN (9 digits) *</label>
            <div class="input-field"><input class="input-field__control owner-ssn" style="padding-left: var(--space-4);" type="text" placeholder="e.g., 600-12-3456" inputmode="numeric" maxlength="11" /></div>
          </div>
        </div>
        <div class="field-group">
          <label class="field-group__label">Address *</label>
          <div class="input-field"><input class="input-field__control owner-address" style="padding-left: var(--space-4);" type="text" placeholder="e.g., 456 Oak Avenue" /></div>
        </div>
        <div class="pay-fields__row pay-fields__row--two">
          <div class="field-group">
            <label class="field-group__label">City *</label>
            <div class="input-field"><input class="input-field__control owner-city" style="padding-left: var(--space-4);" type="text" placeholder="e.g., Chicago" /></div>
          </div>
          <div class="field-group">
            <label class="field-group__label">State *</label>
            <div class="select-field">
              <select class="select-field__control owner-state state-select">
                <option value="">Select...</option>
              </select>
              <span class="select-field__chevron">${ICONS.chevronDown}</span>
            </div>
          </div>
        </div>
        <div class="pay-fields__row pay-fields__row--two">
          <div class="field-group">
            <label class="field-group__label">ZIP *</label>
            <div class="input-field"><input class="input-field__control owner-zip" style="padding-left: var(--space-4);" type="text" placeholder="e.g., 60601" inputmode="numeric" maxlength="10" /></div>
          </div>
          <div class="field-group">
            <label class="field-group__label">Home Phone *</label>
            <div class="input-field"><input class="input-field__control owner-phone" style="padding-left: var(--space-4);" type="tel" placeholder="(555) 123-4567" /></div>
          </div>
        </div>
        <div class="field-group">
          <label class="field-group__label">Email</label>
          <div class="input-field"><input class="input-field__control owner-email" style="padding-left: var(--space-4);" type="email" placeholder="you@example.com" /></div>
          <p class="field-group__hint">Optional.</p>
        </div>
      </div>
    `;
    posOwnersContainer.appendChild(wrapper);

    const firstNameInput = wrapper.querySelector(".owner-first-name");
    const lastNameInput = wrapper.querySelector(".owner-last-name");
    wrapper._collapsible = makeCollapsible(wrapper, {
      header: wrapper.querySelector(".transfer-rule__head"),
      titleEl: wrapper.querySelector(".transfer-rule__title"),
      body: wrapper.querySelector(".transfer-rule__body"),
      ignore: "[data-role='remove-owner']",
      getSummary: () => {
        const first = firstNameInput.value.trim();
        const last = lastNameInput.value.trim();
        const ownership = wrapper.querySelector(".owner-ownership").value.trim();
        if (!first && !last) return "<em>New owner</em>";
        return `${escapeHtml(`${first} ${last}`.trim())}${ownership ? " · " + escapeHtml(ownership) + "%" : ""}`;
      },
    });

    populateStateSelects(wrapper);
    initCustomSelects(wrapper);

    qsa("input, select", wrapper).forEach((el) => {
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", updateContinueState);
    });
    attachValidation(wrapper.querySelector(".owner-dob"), { validate: V.dob, format: F.dob, required: true, message: "Use the format MM/DD/YYYY.", onChange: updateContinueState });
    attachValidation(wrapper.querySelector(".owner-ssn"), { validate: V.ssn, format: F.ssn, required: true, message: "Use the format 600-12-3456.", onChange: updateContinueState });
    attachValidation(wrapper.querySelector(".owner-zip"), { validate: V.zip, format: F.zip, required: true, message: "Enter a valid ZIP.", onChange: updateContinueState });
    attachValidation(wrapper.querySelector(".owner-phone"), { validate: V.phone, format: F.phone, required: true, message: "Enter a valid phone number.", onChange: updateContinueState });
    attachValidation(wrapper.querySelector(".owner-email"), { validate: V.email, message: "Enter a valid email address.", onChange: updateContinueState });

    wrapper.querySelector('[data-role="remove-owner"]').addEventListener("click", () => {
      if (posOwnersContainer.querySelectorAll(".transfer-rule").length <= 1) return;
      wrapper.remove();
      ownerCount -= 1;
      updateOwnerControlsState();
      updateContinueState();
    });

    updateOwnerControlsState();
  }

  function updateOwnerControlsState() {
    const owners = posOwnersContainer.querySelectorAll(".transfer-rule");
    owners.forEach((owner) => {
      const btn = owner.querySelector('[data-role="remove-owner"]');
      if (btn) setHidden(btn, owners.length <= 1);
    });
    setHidden(addOwnerButton, owners.length >= MAX_BENEFICIAL_OWNERS);
  }

  addOwnerButton.addEventListener("click", () => addBeneficialOwner());

  // Not gated - same as Business & Processing Profile, the merchant can move
  // on and fill this in later. Per-field validation above still flags a
  // malformed value, it just doesn't block Continue.
  function posOwnersComplete() {
    return true;
  }

  // ---- Documents, Agreement & Submit ----
  // Each document is a real (visually hidden) file input behind a clickable
  // "upload circle": the ring opens the file picker (also how you replace an
  // already-chosen file), the checkmark badge that appears once a file is
  // chosen clears it back to empty.
  function wireDocUpload(key) {
    const wrapper = qs(`.doc-upload[data-doc="${key}"]`);
    if (!wrapper) return;
    const ring = wrapper.querySelector(".doc-upload__ring");
    const badge = wrapper.querySelector(".doc-upload__badge");
    const input = wrapper.querySelector(".doc-upload__input");
    const ringIcon = wrapper.querySelector(".doc-upload__icon");
    const fileLabel = wrapper.querySelector(".doc-upload__file");

    function sync() {
      const file = input.files && input.files[0];
      wrapper.classList.toggle("is-filled", !!file);
      ringIcon.innerHTML = file ? ICONS.file : ICONS.uploadTray;
      fileLabel.textContent = file ? file.name : "";
    }

    ring.addEventListener("click", () => input.click());
    badge.addEventListener("click", (event) => {
      event.stopPropagation();
      input.value = "";
      sync();
    });
    input.addEventListener("change", sync);
  }
  ["voided-check", "gov-id", "business-license"].forEach(wireDocUpload);

  const consentSignedCheckbox = qs("#checkbox-consent-signed");
  if (consentSignedCheckbox) consentSignedCheckbox.addEventListener("change", updateContinueState);

  // Not gated - same as the other two PoS steps, the merchant can submit and
  // keep moving without having signed yet.
  function posSubmitComplete() {
    return true;
  }

  // ======================================================================
  // Step: Payment Method (individual paying for the Parcera service)
  // A single method is selected at a time; picking one reveals just that
  // method's fields. Keeps the checkout low-friction.
  // ======================================================================
  const payOptions = qsa(".pay-option");
  const payFieldPanels = qsa("[data-pay-fields]");
  const walletNameEl = qs("#pay-wallet-name");
  let selectedPaymentMethod = "card";

  // Renders the selected service + tier as a single row, then the running
  // total. Called whenever the Service Setup selection changes, and again on
  // entry to this step so it's never stale. Only one service can be active
  // at a time in this flow, so there's at most one row.
  const planBreakdownEl = qs("#plan-breakdown");
  const payPlanMetaEl = qs("#pay-plan-meta");
  const payPlanAmountEl = qs("#pay-plan-amount");

  function renderPlanBreakdown() {
    if (!planBreakdownEl) return;
    const entries = Object.entries(selectedServices);
    if (!entries.length) {
      planBreakdownEl.innerHTML = `<p class="plan-breakdown__empty">No products selected yet.</p>`;
    } else {
      planBreakdownEl.innerHTML = entries.map(([id, sel]) => {
        const svc = getService(id);
        const tier = svc.tiers[sel.tierIndex];
        return `
          <div class="plan-breakdown__row">
            <span class="plan-breakdown__label">${svc.label} <span class="plan-breakdown__tier">· ${tier.name}</span></span>
            <span class="plan-breakdown__price">${tier.priceLabel || `$${tier.price}/mo`}</span>
          </div>
        `;
      }).join("");
    }
    const total = serviceTotal();
    if (payPlanMetaEl) {
      payPlanMetaEl.textContent = entries.length ? "1 product selected" : "No products selected";
    }
    if (payPlanAmountEl) payPlanAmountEl.textContent = String(total);
  }

  // Payment field controls (only the active method's fields are validated)
  const payCardName = qs("#pay-card-name");
  const payCardNumber = qs("#pay-card-number");
  const payCardExp = qs("#pay-card-exp");
  const payCardCvc = qs("#pay-card-cvc");
  const payCardZip = qs("#pay-card-zip");
  const payAchRouting = qs("#pay-ach-routing2");
  const payAchAccount = qs("#pay-ach-account2");
  const payAchType = qs("#pay-ach-type2");

  attachValidation(payCardName, { required: true, message: "Name on card is required.", onChange: () => updateLaunchButtonState() });
  attachValidation(payCardNumber, { validate: V.cardNumber, format: F.cardNumber, required: true, message: "Enter a valid card number.", onChange: () => updateLaunchButtonState() });
  attachValidation(payCardExp, { validate: V.cardExp, format: F.cardExp, required: true, message: "Use MM / YY.", onChange: () => updateLaunchButtonState() });
  attachValidation(payCardCvc, { validate: V.cvc, format: F.digits, required: true, message: "3–4 digit CVC.", onChange: () => updateLaunchButtonState() });
  attachValidation(payCardZip, { validate: V.zip, format: F.digits, required: true, message: "Enter a valid ZIP.", onChange: () => updateLaunchButtonState() });
  attachValidation(payAchRouting, { validate: V.routing, format: F.digits, required: true, message: "9-digit routing number.", onChange: () => updateLaunchButtonState() });
  attachValidation(payAchAccount, { validate: V.account, format: F.digits, required: true, message: "Enter a valid account number.", onChange: () => updateLaunchButtonState() });

  const PAYMENT_LABELS = {
    card: "Card (credit/debit)",
    apple: "Apple Pay",
    google: "Google Pay",
    ach: "Bank transfer (ACH)",
  };

  // Card / ACH each show a dedicated field panel; the express wallets share
  // the single "wallet" confirmation panel.
  function panelForMethod(method) {
    if (method === "apple" || method === "google") return "wallet";
    return method;
  }

  function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    payOptions.forEach((opt) => {
      const isSel = opt.dataset.method === method;
      opt.classList.toggle("is-selected", isSel);
      const check = qs(`#icon-method-${opt.dataset.method}-check`);
      if (check) setHidden(check, !isSel);
    });

    const activePanel = panelForMethod(method);
    payFieldPanels.forEach((panel) => {
      setHidden(panel, panel.dataset.payFields !== activePanel);
    });

    // Personalize the wallet confirmation copy
    if (activePanel === "wallet" && walletNameEl) {
      walletNameEl.textContent = PAYMENT_LABELS[method];
    }
    updateLaunchButtonState();
  }

  payOptions.forEach((opt) => {
    opt.addEventListener("click", () => selectPaymentMethod(opt.dataset.method));
  });

  // A method must be selected, and the active method's fields must be valid.
  // Wallet (Apple/Google) collects nothing here.
  function paymentReady() {
    if (!selectedPaymentMethod) return false;
    if (selectedPaymentMethod === "card") {
      return V.required(payCardName.value) && V.cardNumber(payCardNumber.value) &&
        V.cardExp(payCardExp.value) && V.cvc(payCardCvc.value) && V.zip(payCardZip.value);
    }
    if (selectedPaymentMethod === "ach") {
      return V.routing(payAchRouting.value) && V.account(payAchAccount.value);
    }
    return true;
  }

  // ======================================================================
  // Step: Review (full report pulling from every node) + Payment/Launch
  // ======================================================================
  const paymentFormPhase = qs("#payment-form-phase");
  const launchSuccessPhase = qs("#launch-success-phase");
  const launchButton = qs("#btn-launch");
  const launchSuccessSubtitle = qs("#launch-success-subtitle");
  const businessTypeInput = qs("#input-business-type");
  const launchPhoneChipNumber = qs("#launch-phone-chip-number");

  // Switching to/from an auto or rental business type changes which steps
  // are skipped (see stepSkipped/isNonAgentBusiness below), so the stepper
  // needs to redraw immediately to hide or restore the Knowledge Base and
  // Voice AI badges.
  businessTypeInput.addEventListener("change", () => refreshStepper());

  // The AI phone number is assigned once per launch and reused if the
  // celebration screen is revisited (e.g. Storefront -> "Back to launch").
  let assignedAiPhoneNumber = "";
  function assignAiPhoneNumberIfNeeded() {
    if (!assignedAiPhoneNumber) {
      const area = 2 + Math.floor(Math.random() * 8);
      const exchange = 2 + Math.floor(Math.random() * 8);
      const digits = () => Math.floor(Math.random() * 10);
      const areaCode = `${area}${digits()}${digits()}`;
      const exchangeCode = `${exchange}${digits()}${digits()}`;
      const lineNumber = `${digits()}${digits()}${digits()}${digits()}`;
      assignedAiPhoneNumber = `+1 (${areaCode}) ${exchangeCode}-${lineNumber}`;
    }
    if (launchPhoneChipNumber) launchPhoneChipNumber.textContent = assignedAiPhoneNumber;
  }

  // Small helper: sets a report value, falling back to a neutral placeholder
  function setReport(id, value) {
    const el = qs(`#${id}`);
    if (el) el.textContent = value && String(value).trim() ? value : "Not set";
  }

  // Launching needs at least one service selected and a valid payment method.
  function updateLaunchButtonState() {
    if (launchButton) launchButton.disabled = Object.keys(selectedServices).length === 0 || !paymentReady();
  }

  // One row per selected service, editable right here: change its tier with
  // the inline select, or drop it entirely with the remove button - no need
  // to jump back to Service Setup for either.
  function renderServicesReport() {
    const rowsEl = qs("#rep-services-rows");
    if (!rowsEl) return;
    const entries = Object.entries(selectedServices);
    if (!entries.length) {
      rowsEl.innerHTML = `<p class="service-report-rows__empty">No services selected.</p>`;
      return;
    }
    rowsEl.innerHTML = entries.map(([id, sel]) => {
      const svc = getService(id);
      const tier = svc.tiers[sel.tierIndex];
      return `
        <div class="service-report-row" data-service="${id}">
          <div class="service-report-row__info">
            <span class="service-report-row__name">${svc.label}</span>
            <span class="service-report-row__price">${tier.name} · ${tier.priceLabel || `$${tier.price}/mo`}</span>
          </div>
          <div class="select-field service-report-row__tier-field">
            <select class="select-field__control" data-role="tier-select">
              ${svc.tiers.map((t, i) => `<option value="${i}" ${i === sel.tierIndex ? "selected" : ""}>${t.name}</option>`).join("")}
            </select>
            <span class="select-field__chevron">${ICONS.chevronDown}</span>
          </div>
          <button type="button" class="service-report-row__remove" data-role="remove" aria-label="Remove ${svc.label}">${ICONS.close}</button>
        </div>
      `;
    }).join("");

    rowsEl.querySelectorAll(".service-report-row").forEach((row) => {
      const id = row.dataset.service;
      const select = row.querySelector('[data-role="tier-select"]');
      const removeBtn = row.querySelector('[data-role="remove"]');
      select.addEventListener("change", () => {
        selectedServices[id].tierIndex = Number(select.value);
        syncServiceTiles();
        renderPlanBreakdown();
        renderServicesReport();
      });
      removeBtn.addEventListener("click", () => {
        delete selectedServices[id];
        syncServiceTiles();
        renderPlanBreakdown();
        renderServicesReport();
        updateLaunchButtonState();
        syncDigitalSuiteToggle();
      });
    });
    initCustomSelects(rowsEl);
  }

  function populateReviewSummary() {
    // Business
    setReport("rep-business-name", businessNameInput.value.trim() || "Your Business");
    setReport("rep-business-type", businessTypeInput ? businessTypeInput.value : "");
    setReport("rep-business-ein", businessEINInput.value.trim());
    setReport("rep-owner-name", ownerNameInput.value.trim());
    setReport("rep-owner-email", ownerEmailInput.value.trim());
    setReport("rep-owner-phone", ownerPhoneInput.value.trim());

    // Locations (+ how many are verified)
    const addresses = getAllAddresses().filter((entry) => entry.address);
    const verifiedCount = addresses.filter((entry) => entry.verified).length;
    const locationLabel = addresses.length === 1 ? "1 location" : `${addresses.length} locations`;
    const verifiedLabel = verifiedCount ? ` · ${verifiedCount} verified` : "";
    setReport("rep-locations", addresses.length ? `${locationLabel}${verifiedLabel}` : "No address yet");

    // Knowledge Base: menu, operating hours, and optional extra details
    const menus = getAllMenus().filter((menu) => menu.manualText || menu.fileName || menu.linkUrl);
    const menuLabel = menus.length === 1 ? "1 menu" : `${menus.length} menus`;
    setReport("rep-menus", menus.length ? menuLabel : "None uploaded");
    const hasHours = qsa("#kb-hours-container input[type='time']").some((i) => i.value);
    setReport("rep-hours", hasHours ? "Added" : "Not set");
    const detailFields = ["dietary", "allergens", "kids", "parking", "about"]
      .map((k) => kbTextInputs[k]).filter((el) => el && el.value.trim());
    const detailCount = detailFields.length + (getKbPaymentMethods().length ? 1 : 0);
    setReport("rep-kb-details", detailCount ? `${detailCount} added` : "None");

    // Products (editable inline: tier select + remove per row)
    renderServicesReport();
    updateLaunchButtonState();

    // Parcera AI
    setReport("rep-assistant-name", assistantNameInput.value.trim() || "Your Assistant");
    const voiceLabel = voiceSelect.options[voiceSelect.selectedIndex]?.textContent;
    setReport("rep-voice", voiceSelect.value ? voiceLabel : "Not selected");
    setReport("rep-languages", spanishCheckbox.checked ? "English, Spanish" : "English");
    const transferCount = transferRulesContainer.querySelectorAll(".transfer-rule").length;
    setReport("rep-transfers", transferCount ? `${transferCount} number${transferCount === 1 ? "" : "s"}` : "Not set");
    const greeting = getFirstGreetingText();
    setReport("rep-greeting", greeting ? `"${greeting}"` : "Not set");

    // Fold every group to its fresh one-line summary so the review opens as a
    // compact, scannable list (each group expands on demand).
    initReviewCollapsibles();
    reviewCollapsibles.forEach((c) => c.collapse());
  }

  // Wire the per-section Edit links to jump back to their step
  qsa(".report__edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.editStep;
      const targetIndex = WIZARD_STEPS.findIndex((s) => s.id === targetId);
      if (targetIndex !== -1) navigateToStep(targetIndex);
    });
  });

  // Make each Review group collapsible so the summary reads as a short,
  // scannable list; each collapsed group shows a one-line digest. Keyed by
  // the group's title so the right summary is produced for each.
  const reviewCollapsibles = [];
  function repText(id) {
    return escapeHtml((qs("#" + id)?.textContent || "").trim());
  }
  const reviewSummaries = {
    "Business Details": () => `${repText("rep-business-name")} · ${repText("rep-business-type")}`,
    "Locations": () => repText("rep-locations"),
    "Products": () => {
      const n = Object.keys(selectedServices).length;
      if (!n) return "<em>No products selected</em>";
      return `${n} product${n === 1 ? "" : "s"} · $${serviceTotal()}/mo`;
    },
    "Knowledge Base": () => `${repText("rep-menus")} · ${repText("rep-hours")}`,
    "Voice AI": () => `${repText("rep-assistant-name")} · ${repText("rep-voice")}`,
  };
  function initReviewCollapsibles() {
    if (reviewCollapsibles.length) return; // wire once
    qsa("#launch-report .report__group").forEach((group) => {
      const title = group.querySelector(".report__group-title")?.textContent.trim();
      const body = group.querySelector(".report__rows, .service-report-rows");
      const getSummary = reviewSummaries[title];
      if (!body || !getSummary) return;
      reviewCollapsibles.push(
        makeCollapsible(group, {
          header: group.querySelector(".report__group-head"),
          titleEl: group.querySelector(".report__group-title"),
          body,
          ignore: ".report__edit",
          getSummary,
          collapsed: true,
        })
      );
    });
  }

  function showPaymentFormPhase() {
    setHidden(paymentFormPhase, false);
    setHidden(launchSuccessPhase, true);
    setHidden(bottomNav, false);
    renderPlanBreakdown();
  }

  const dashboardLink = qs("#link-dashboard");

  launchButton.addEventListener("click", () => {
    const businessName = businessNameInput.value.trim() || "Your Business";
    launchSuccessSubtitle.textContent = `Your subscription to the products is successful.`;
    assignAiPhoneNumberIfNeeded();

    // Persist business + menus + selected services for cross-page carry-over
    persistCarryOver();

    // Carry the verified contact to the dashboard sign-in, the same way the
    // first landing page hands its channel + contact to the next screen, so
    // the portal can prefill and the user signs in with no extra typing.
    const channel = ownerEmailInput.value.trim() ? "email" : "phone";
    const contact = channel === "email" ? ownerEmailInput.value.trim() : ownerPhoneInput.value.trim();
    if (contact) {
      dashboardLink.href = `merchant-portal.html?channel=${channel}&contact=${encodeURIComponent(contact)}`;
    }

    setHidden(paymentFormPhase, true);
    setHidden(launchSuccessPhase, false);
    // Terminal screen, no further navigation needed on either button
    setHidden(bottomNav, true);
    setHidden(backButton, true);
  });

  // ======================================================================
  // Navigation: stepper rendering, validation, back/continue/skip/restart
  // ======================================================================
  // Validates whether a given step has been filled correctly. Used to
  // decide when a badge may turn complete (solid blue) after the user leaves it.
  function isStepComplete(stepId) {
    switch (stepId) {
      case "business":
        return businessFormComplete();
      case "knowledge":
        return true; // optional (menu, rules, hours, details), never blocks
      case "integration":
        return integrationComplete();
      case "voice-greeting": {
        const hasName = assistantNameInput.value.trim().length > 0;
        const hasVoice = voiceSelect.value !== "";
        const firstRule = transferRulesContainer.querySelector(".transfer-rule");
        const hasTransfer = firstRule
          ? firstRule.querySelector(".transfer-label").value.trim() && V.phone(firstRule.querySelector(".transfer-phone").value)
          : false;
        return hasName && hasVoice && hasTransfer;
      }
      case "pos-business":
        return posBusinessComplete();
      case "pos-owners":
        return posOwnersComplete();
      case "pos-submit":
        return posSubmitComplete();
      case "review":
        return true; // just a summary + edit-links, nothing to validate here
      case "payments":
        return paymentReady();
      default:
        return false;
    }
  }

  // Auto/rental business types (Car Rentals, Auto Dealership, Auto Service
  // Shop) are PoS-only industries - no Voice AI agent, so both the agent's
  // Knowledge Base (menu, service rules, hours) and its own setup step are
  // skipped entirely rather than just hidden/emptied like the Reservations
  // no-menu case below.
  const NON_AGENT_BUSINESS_TYPES = ["Car Rentals", "Auto Dealership", "Auto Service Shop"];
  function isNonAgentBusiness() {
    return NON_AGENT_BUSINESS_TYPES.includes(businessTypeInput.value);
  }

  // The Restaurant Details step always shows. For Reservations it has no menu,
  // so it shows a short "reservations don't use a menu" note instead (see
  // syncMenuVisibility) rather than being skipped - keeping the node visible.
  const POS_STEP_IDS = ["pos-business", "pos-owners", "pos-submit"];
  function stepSkipped(stepId) {
    if ((stepId === "knowledge" || stepId === "voice-greeting") && isNonAgentBusiness()) return true;
    if (POS_STEP_IDS.includes(stepId) && !isPosSelected()) return true;
    return false;
  }
  // Walks from `index` in direction `dir` (+1/-1) past any skipped steps.
  function skipPast(index, dir) {
    let i = index;
    while (i > 0 && i < WIZARD_STEPS.length - 1 && stepSkipped(WIZARD_STEPS[i].id)) i += dir;
    return i;
  }

  // Re-render the stepper reflecting current completion + reachability
  function refreshStepper() {
    const skipped = new Set();
    if (isNonAgentBusiness()) {
      skipped.add("knowledge");
      skipped.add("voice-greeting");
    }
    if (!isPosSelected()) POS_STEP_IDS.forEach((id) => skipped.add(id));
    renderStepper(stepperEl, currentStepIndex, {
      completed: completedSteps,
      maxReachable: maxReachedIndex,
      onNavigate: navigateToStep,
      skipped,
    });
  }

  // Jump to any reachable step from a stepper badge click. Before leaving
  // the current step, record whether it was completed so it greens out.
  function navigateToStep(index) {
    if (index === currentStepIndex || stepSkipped(WIZARD_STEPS[index].id)) return;
    syncCurrentStepCompletion();
    showStep(index);
  }

  // Marks the current step complete (or not) based on its validation
  function syncCurrentStepCompletion() {
    const step = WIZARD_STEPS[currentStepIndex];
    if (isStepComplete(step.id)) completedSteps.add(step.id);
    else completedSteps.delete(step.id);
  }

  function showStep(index) {
    currentStepIndex = index;
    maxReachedIndex = Math.max(maxReachedIndex, index);

    // Every step transition (Continue, Back, or jumping via a stepper badge)
    // starts scrolled to the top, so the new step's heading is immediately
    // visible instead of staying wherever the previous step was scrolled to.
    window.scrollTo(0, 0);
    setHidden(restartLink, index === 0);
    setHidden(bottomNav, false);
    setHidden(backButton, false);

    const step = WIZARD_STEPS[index];

    wizardSteps.forEach((panel) => {
      setHidden(panel, panel.dataset.stepId !== step.id);
    });

    // Knowledge Base: sync each menu's location dropdown (menu shows for both
    // products), and render its rules (ordering vs reservation).
    if (step.id === "knowledge") {
      refreshMenuLocationOptions(getLocationOptions());
      renderServiceRules();
    }

    if (step.id === "review") populateReviewSummary();
    if (step.id === "payments") showPaymentFormPhase();

    // The Payment step uses its own in-panel Launch button instead of the
    // shared Continue button
    setHidden(continueButton, step.id === "payments");

    // Make sure at least one transfer rule and one greeting block exist.
    if (step.id === "voice-greeting") {
      if (transferRuleCount === 0) addTransferRule({ label: "General", phone: "", condition: "" });
      if (!greetingsContainer.children.length) renderGreetings();
    }

    // Parcera PoS setup: default Nature of Business / Contact Name from the
    // main Business Details step, and make sure at least one beneficial
    // owner card exists.
    if (step.id === "pos-business") syncPosBusinessDefaults();
    if (step.id === "pos-owners") {
      if (ownerCount === 0) addBeneficialOwner();
      syncPosOwnersDefaults();
    }

    // The final PoS step's Continue button reads "Submit Application" since
    // it's what actually sends the application onward - everywhere else it
    // just reads "Continue".
    if (continueLabelEl) continueLabelEl.textContent = step.id === "pos-submit" ? "Submit Application" : "Continue";

    refreshStepper();
    updateContinueState();
  }

  function updateContinueState() {
    let enabled = true;
    const step = WIZARD_STEPS[currentStepIndex];

    if (step.id === "business") {
      enabled = businessFormComplete();

      // Guide the user: if every other field is valid but consent is still
      // unchecked, outline the consent box so the block is obvious.
      const email = ownerEmailInput.value.trim();
      const phone = ownerPhoneInput.value.trim();
      const othersValid = V.required(businessNameInput.value) && V.required(ownerNameInput.value) &&
        V.ein(businessEINInput.value) && ((email && V.email(email)) || (phone && V.phone(phone)));
      const consentWrap = smsConsentCheckbox.closest(".consent-check");
      if (consentWrap) consentWrap.classList.toggle("consent-check--error", othersValid && !smsConsentCheckbox.checked);
    } else if (step.id === "integration") {
      enabled = integrationComplete();
    } else if (step.id === "voice-greeting") {
      const hasName = assistantNameInput.value.trim().length > 0;
      const hasVoice = voiceSelect.value !== "";
      const firstRule = transferRulesContainer.querySelector(".transfer-rule");
      const hasTransferNumber = firstRule
        ? firstRule.querySelector(".transfer-label").value.trim() && V.phone(firstRule.querySelector(".transfer-phone").value)
        : false;
      enabled = hasName && hasVoice && hasTransferNumber;
    } else if (step.id === "pos-business") {
      enabled = posBusinessComplete();
    } else if (step.id === "pos-owners") {
      enabled = posOwnersComplete();
    } else if (step.id === "pos-submit") {
      enabled = posSubmitComplete();
    }

    continueButton.disabled = !enabled;
  }

  // Advances to the next step, used by the shared Continue button.
  function goToNextStep() {
    syncCurrentStepCompletion();
    if (currentStepIndex < WIZARD_STEPS.length - 1) showStep(skipPast(currentStepIndex + 1, +1));
  }

  function goBack() {
    if (currentStepIndex === 0) {
      window.location.href = "merchant-portal.html";
      return;
    }
    // Back out of the launch success screen into the payment form first
    if (currentStepIndex === WIZARD_STEPS.length - 1 && !launchSuccessPhase.classList.contains("is-hidden")) {
      showPaymentFormPhase();
      return;
    }
    syncCurrentStepCompletion();
    showStep(skipPast(currentStepIndex - 1, -1));
  }

  function goContinue() {
    if (continueButton.disabled) return;
    goToNextStep();
  }

  // Resets only the per-service AI persona (assistant name, voice, greetings)
  // and the service selections. Business, locations, hours, menus, the whole
  // Knowledge Base, the transfer numbers AND the saved payment method are
  // left untouched - used only by the full "Start over" reset below.
  function clearServiceSpecificState() {
    assistantNameInput.value = "";
    voiceSelect.value = "";
    spanishCheckbox.checked = false;

    // Transfer rules (the transfer numbers) are business routing and persist;
    // only the generated greetings reset with the AI persona.
    greetingsContainer.innerHTML = "";
    Object.keys(greetingDirty).forEach((key) => delete greetingDirty[key]);

    selectedServices = {};
    syncServiceTiles();
    renderPlanBreakdown();
    refreshCustomSelects();

    digitalStorefront.enabled = true; // back to the default on
    syncDigitalSuiteToggle();

    completedSteps.clear();
    maxReachedIndex = 0;
  }

  // Clears all transfer rules (used only by the full "Start over" reset)
  function resetTransferRules() {
    transferRuleCount = 0;
    transferRulesContainer.innerHTML = "";
  }

  // Full "Start over": wipe everything, including business, menus, and the
  // selected services.
  function restartWizard() {
    clearOnboardingState();   // forget any cross-page carry-over
    clearVerifiedContacts();  // and any remembered verifications

    businessNameInput.value = "";
    businessEINInput.value = "";
    ownerNameInput.value = "";
    ownerEmailInput.value = "";
    ownerPhoneInput.value = "";
    smsConsentCheckbox.checked = false;

    // Rebuild the locations list with a single seed block
    resetAddressBlocks(addressesContainer);
    addAddressBlock(addressesContainer, { removable: false });

    // Reset Restaurant Details: menu, hours, text fields, payment chips
    resetMenus(kbMenusContainer);
    addMenu(kbMenusContainer, { removable: false, locations: getLocationOptions() });
    renderBusinessHours(kbHoursContainer);
    Object.values(kbTextInputs).forEach((el) => { if (el) el.value = ""; });
    setKbPaymentMethods(DEFAULT_KB_PAYMENTS);

    // Transfer rules only fully reset here (they persist between services)
    resetTransferRules();

    // Full reset also clears the payment method + entered details
    [payCardName, payCardNumber, payCardExp, payCardCvc, payCardZip, payAchRouting, payAchAccount].forEach((el) => { if (el) el.value = ""; });
    selectedPaymentMethod = "card";

    clearServiceSpecificState(); // also clears selectedServices + repaints tiles

    showStep(0);
  }

  backButton.addEventListener("click", goBack);
  continueButton.addEventListener("click", goContinue);
  restartLink.addEventListener("click", restartWizard);

  // ---- Auto-fill from landing page -----------------------------------------
  // Uses the landingChannel / landingContact parsed in the Business Details
  // section above, so the value that gets prefilled is the same one the
  // "already verified" check compares against.
  if (landingChannel && landingContact) {
    if (landingChannel === "email") {
      ownerEmailInput.value = landingContact;
    } else if (landingChannel === "phone") {
      ownerPhoneInput.value = landingContact;
    }
  }

  // Jumps straight to the launch celebration screen, e.g. when returning
  // from the storefront page via "Back to launch". Reuses the success phase
  // without re-running the wizard.
  function showLaunchCelebration() {
    const launchIndex = WIZARD_STEPS.findIndex((s) => s.id === "payments");
    currentStepIndex = launchIndex;
    maxReachedIndex = launchIndex;

    wizardSteps.forEach((panel) => setHidden(panel, panel.dataset.stepId !== "payments"));
    setHidden(restartLink, true);
    setHidden(paymentFormPhase, true);
    setHidden(launchSuccessPhase, false);
    setHidden(bottomNav, true);
    setHidden(backButton, true);
    const businessName = businessNameInput.value.trim() || "Your business";
    launchSuccessSubtitle.textContent = `Your subscription to the products is successful.`;
    assignAiPhoneNumberIfNeeded();
    refreshStepper();
  }

  // ---- Carry-over persistence ----------------------------------------------
  // Persists the business, menus, and selected services so the wizard still
  // reflects everything after navigating away and back (e.g. Storefront ->
  // "Back to launch"). Session-scoped; cleared on reset.
  function collectCarryOverState() {
    // Zip ids (from getLocationOptions) with address data so menus can be
    // re-linked to the right location even after restore.
    const opts = getLocationOptions();      // [{ value:id, label }]
    const addrs = getAllAddresses();          // [{ address, verified }]
    return {
      business: {
        name: businessNameInput.value,
        type: businessTypeInput.value,
        ein: businessEINInput.value,
        ownerName: ownerNameInput.value,
        ownerEmail: ownerEmailInput.value,
        ownerPhone: ownerPhoneInput.value,
        smsConsent: smsConsentCheckbox.checked,
      },
      locations: addrs.map((a, i) => ({ id: opts[i] ? opts[i].value : null, address: a.address, verified: a.verified })),
      menus: getAllMenus(),                   // [{ fileName, locationValue, locationLabel }]
      services: selectedServices,             // { [serviceId]: { tierIndex, management, toastLink } }
      digitalStorefront: { ...digitalStorefront },  // { enabled }
      payment: {
        method: selectedPaymentMethod,
        cardName: payCardName.value,
        cardNumber: payCardNumber.value,
        cardExp: payCardExp.value,
        cardCvc: payCardCvc.value,
        cardZip: payCardZip.value,
        achRouting: payAchRouting.value,
        achAccount: payAchAccount.value,
        achType: payAchType ? payAchType.value : "",
      },
      // Knowledge Base: hours, free-text fields, payment chips, FAQs
      knowledge: {
        hours: getBusinessHoursValue(kbHoursContainer),
        dietary: kbTextInputs.dietary.value,
        allergens: kbTextInputs.allergens.value,
        kids: kbTextInputs.kids.value,
        parking: kbTextInputs.parking.value,
        about: kbTextInputs.about.value,
        paymentMethods: getKbPaymentMethods(),
      },
      // Transfer numbers from AI setup (carried across services)
      transferRules: [...transferRulesContainer.querySelectorAll(".transfer-rule")].map((r) => ({
        label: r.querySelector(".transfer-label").value,
        phone: r.querySelector(".transfer-phone").value,
        condition: r.querySelector(".transfer-rule__condition").value,
      })),
      // Voice AI setup persona (name, voice, language, greeting)
      voiceAi: {
        name: assistantNameInput.value,
        voice: voiceSelect.value,
        spanish: spanishCheckbox.checked,
        greeting: getFirstGreetingText(),
      },
    };
  }

  function persistCarryOver() {
    saveOnboardingState(collectCarryOverState());
  }

  // Rebuilds business + locations + menus + selected services from a saved
  // session so the wizard resumes with everything the business already set up.
  function restoreCarryOver(state) {
    if (!state) return;
    const b = state.business || {};
    businessNameInput.value = b.name || "";
    businessTypeInput.value = b.type || "";
    businessEINInput.value = b.ein || "";
    ownerNameInput.value = b.ownerName || "";
    ownerEmailInput.value = b.ownerEmail || "";
    ownerPhoneInput.value = b.ownerPhone || "";
    smsConsentCheckbox.checked = !!b.smsConsent;

    // Locations first (seed is non-removable). Capture old-id -> new-id so
    // menus can be re-linked to the correct restored location.
    resetAddressBlocks(addressesContainer);
    const locs = state.locations && state.locations.length ? state.locations : [null];
    const idMap = {};
    locs.forEach((loc, i) => {
      const entry = addAddressBlock(addressesContainer, { removable: i > 0, prefill: loc });
      if (loc && loc.id != null) idMap[String(loc.id)] = String(entry.id);
    });

    // Single menu - restore the first saved one (if any) into the one card
    resetMenus(kbMenusContainer);
    const savedMenu = (state.menus || [])[0];
    const remapped = savedMenu ? { ...savedMenu, locationValue: idMap[savedMenu.locationValue] || "" } : null;
    addMenu(kbMenusContainer, { removable: false, locations: getLocationOptions(), prefill: remapped });

    selectedServices = state.services || {};
    syncServiceTiles();
    renderPlanBreakdown();

    // Restore whether the Digital Storefront was left on (defaults on)
    const ds = state.digitalStorefront || {};
    digitalStorefront.enabled = ds.enabled !== false;
    syncDigitalSuiteToggle();

    // Restore the payment method + entered details from the first walkthrough
    const p = state.payment || {};
    if (payCardName) payCardName.value = p.cardName || "";
    if (payCardNumber) payCardNumber.value = p.cardNumber || "";
    if (payCardExp) payCardExp.value = p.cardExp || "";
    if (payCardCvc) payCardCvc.value = p.cardCvc || "";
    if (payCardZip) payCardZip.value = p.cardZip || "";
    if (payAchRouting) payAchRouting.value = p.achRouting || "";
    if (payAchAccount) payAchAccount.value = p.achAccount || "";
    if (payAchType && p.achType) payAchType.value = p.achType;
    selectPaymentMethod(p.method || "card");

    // Restore the Knowledge Base (hours, free-text fields, payment chips, FAQs)
    const kb = state.knowledge || {};
    setBusinessHoursValue(kbHoursContainer, kb.hours);
    if (kbTextInputs.dietary) kbTextInputs.dietary.value = kb.dietary || "";
    if (kbTextInputs.allergens) kbTextInputs.allergens.value = kb.allergens || "";
    if (kbTextInputs.kids) kbTextInputs.kids.value = kb.kids || "";
    if (kbTextInputs.parking) kbTextInputs.parking.value = kb.parking || "";
    if (kbTextInputs.about) kbTextInputs.about.value = kb.about || "";
    if (kb.paymentMethods) setKbPaymentMethods(kb.paymentMethods);

    // Restore the transfer numbers from AI setup
    resetTransferRules();
    const rules = (state.transferRules && state.transferRules.length) ? state.transferRules : null;
    if (rules) rules.forEach((r) => addTransferRule(r));

    // Restore the Voice AI persona (name, voice, language, greeting)
    const va = state.voiceAi || {};
    assistantNameInput.value = va.name || "";
    if (va.voice) voiceSelect.value = va.voice;
    spanishCheckbox.checked = !!va.spanish;
    renderGreetings();
    if (va.greeting) {
      const englishArea = greetingsContainer.querySelector('[data-lang="english"]');
      if (englishArea) { englishArea.value = va.greeting; greetingDirty.english = true; }
    }

    refreshCustomSelects();
  }

  // ---- Initial render -----------------------------------------------------
  selectPaymentMethod("card"); // default method + reveal its fields

  // Land on the celebration screen when deep-linked (e.g. Storefront's "Back
  // to launch"), restoring the business, menus, and services first.
  if (landingParams.get("view") === "launched") {
    restoreCarryOver(loadOnboardingState());
    showLaunchCelebration();
  } else if (landingParams.get("flow") === "add-location") {
    // Re-onboarding another location: prefill everything from the last run,
    // then clear just the location address so they enter the new one, and
    // clear the Voice AI name so this location's assistant gets its own.
    const saved = loadOnboardingState();
    if (saved) {
      restoreCarryOver(saved);
      resetAddressBlocks(addressesContainer);
      addAddressBlock(addressesContainer, { removable: false });
      // This location's assistant gets its own name; clear it (and refresh the
      // greeting so its default no longer shows the previous location's name).
      if (assistantNameInput) assistantNameInput.value = "";
      delete greetingDirty.english;
      renderGreetings();
      setHidden(qs("#add-location-banner"), false);
    }
    showStep(0);
  } else {
    showStep(0);
  }
});
