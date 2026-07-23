// ==========================================================================
// Component: Business Hours
// A compact hours widget: one "every day" row covers the common case (and
// is all that's visible until expanded), plus a small "Additional Hours"
// trigger for exceptions - different hours on specific days, or a second
// open/close period on top of the first (e.g. lunch + dinner). Collapsed
// behind an accordion so the Knowledge Base step stays short by default.
// ==========================================================================

import { ICONS } from "../utils/icons.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function periodRowHTML() {
  return `
    <div class="hours-exception__period" data-role="period">
      <input type="time" class="input-field__control hours-row__time" data-role="open" />
      <span class="hours-row__dash">–</span>
      <input type="time" class="input-field__control hours-row__time" data-role="close" />
      <button type="button" class="hours-exception__remove-period" data-role="remove-period" aria-label="Remove period">${ICONS.close}</button>
    </div>
  `;
}

export function renderBusinessHours(container) {
  const exceptions = []; // { id, element, getData(), setData() }
  let exceptionCounter = 0;

  container.innerHTML = `
    <div class="hours-widget">
      <button type="button" class="hours-widget__summary" data-role="toggle">
        <span class="hours-widget__summary-icon">${ICONS.clock}</span>
        <span class="hours-widget__summary-text" data-role="summary-text">Add your hours</span>
        <span class="hours-widget__chevron">${ICONS.chevronDown}</span>
      </button>

      <div class="hours-widget__body is-hidden" data-role="body">
        <div class="hours-widget__primary">
          <span class="hours-widget__primary-label">Every day</span>
          <div class="hours-row__times">
            <input type="time" class="input-field__control hours-row__time" data-role="primary-open" />
            <span class="hours-row__dash">–</span>
            <input type="time" class="input-field__control hours-row__time" data-role="primary-close" />
          </div>
          <label class="toggle-switch hours-row__closed">
            <input type="checkbox" class="toggle-switch__input" data-role="primary-closed" />
            <span class="toggle-switch__label">Closed</span>
          </label>
        </div>

        <div class="hours-widget__exceptions" data-role="exceptions"></div>

        <button type="button" class="hours-widget__add-exception" data-role="add-exception">
          ${ICONS.plus} Additional Hours
        </button>
      </div>
    </div>
  `;

  // ---- Accordion open/close ----------------------------------------------
  const summaryToggle = container.querySelector('[data-role="toggle"]');
  const body = container.querySelector('[data-role="body"]');
  const summaryText = container.querySelector('[data-role="summary-text"]');

  summaryToggle.addEventListener("click", () => {
    const isOpen = !body.classList.contains("is-hidden");
    body.classList.toggle("is-hidden", isOpen);
    summaryToggle.classList.toggle("is-open", !isOpen);
  });

  // ---- Primary "every day" row --------------------------------------------
  const primaryOpen = container.querySelector('[data-role="primary-open"]');
  const primaryClose = container.querySelector('[data-role="primary-close"]');
  const primaryClosed = container.querySelector('[data-role="primary-closed"]');

  function syncPrimaryDisabled() {
    [primaryOpen, primaryClose].forEach((input) => (input.disabled = primaryClosed.checked));
  }

  [primaryOpen, primaryClose, primaryClosed].forEach((el) => el.addEventListener("change", updateSummary));
  primaryClosed.addEventListener("change", syncPrimaryDisabled);

  // ---- Exceptions ----------------------------------------------------------
  const exceptionsContainer = container.querySelector('[data-role="exceptions"]');
  const addExceptionBtn = container.querySelector('[data-role="add-exception"]');

  function addException(prefill = null) {
    exceptionCounter += 1;
    const id = exceptionCounter;

    const el = document.createElement("div");
    el.className = "hours-exception";
    el.innerHTML = `
      <div class="hours-exception__days" data-role="days">
        ${DAYS.map((d) => `<button type="button" class="day-chip" data-day="${d}">${d}</button>`).join("")}
      </div>
      <div class="hours-exception__periods" data-role="periods">
        ${periodRowHTML()}
      </div>
      <div class="hours-exception__actions">
        <button type="button" class="hours-exception__add-period" data-role="add-period">${ICONS.plus} Split hours</button>
        <label class="toggle-switch hours-row__closed">
          <input type="checkbox" class="toggle-switch__input" data-role="closed" />
          <span class="toggle-switch__label">Closed</span>
        </label>
        <button type="button" class="hours-exception__remove" data-role="remove" aria-label="Remove">${ICONS.close}</button>
      </div>
    `;
    exceptionsContainer.appendChild(el);

    const dayChips = Array.from(el.querySelectorAll(".day-chip"));
    const periodsWrap = el.querySelector('[data-role="periods"]');
    const addPeriodBtn = el.querySelector('[data-role="add-period"]');
    const closedToggle = el.querySelector('[data-role="closed"]');
    const removeBtn = el.querySelector('[data-role="remove"]');

    function syncPeriodInputs() {
      const disabled = closedToggle.checked;
      periodsWrap.querySelectorAll(".hours-row__time").forEach((input) => (input.disabled = disabled));
      addPeriodBtn.disabled = disabled;
      addPeriodBtn.classList.toggle("is-disabled", disabled);
    }

    dayChips.forEach((chip) => chip.addEventListener("click", () => {
      chip.classList.toggle("is-selected");
      updateSummary();
    }));

    addPeriodBtn.addEventListener("click", () => {
      if (periodsWrap.children.length >= 2) return; // one split is enough to stay concise
      periodsWrap.insertAdjacentHTML("beforeend", periodRowHTML());
      wirePeriodRemove(periodsWrap.lastElementChild);
      addPeriodBtn.classList.add("is-hidden");
    });

    function wirePeriodRemove(periodEl) {
      periodEl.querySelector('[data-role="remove-period"]').addEventListener("click", () => {
        periodEl.remove();
        addPeriodBtn.classList.remove("is-hidden");
      });
    }
    wirePeriodRemove(periodsWrap.querySelector('[data-role="period"]'));
    // A lone remaining period can't be removed - only the "+ Split hours" add-on can
    periodsWrap.querySelector('[data-role="remove-period"]').classList.add("is-hidden");

    closedToggle.addEventListener("change", () => { syncPeriodInputs(); updateSummary(); });
    removeBtn.addEventListener("click", () => {
      const index = exceptions.findIndex((entry) => entry.id === id);
      if (index !== -1) exceptions.splice(index, 1);
      el.remove();
      updateSummary();
    });

    const entry = {
      id,
      element: el,
      getData: () => ({
        days: dayChips.filter((c) => c.classList.contains("is-selected")).map((c) => c.dataset.day),
        closed: closedToggle.checked,
        periods: Array.from(periodsWrap.querySelectorAll('[data-role="period"]')).map((p) => ({
          open: p.querySelector('[data-role="open"]').value,
          close: p.querySelector('[data-role="close"]').value,
        })),
      }),
      setData: (data) => {
        if (!data) return;
        dayChips.forEach((c) => c.classList.toggle("is-selected", (data.days || []).includes(c.dataset.day)));
        closedToggle.checked = Boolean(data.closed);
        const periods = data.periods && data.periods.length ? data.periods : [{ open: data.open || "", close: data.close || "" }];
        periodsWrap.innerHTML = periods.map(periodRowHTML).join("");
        periodsWrap.querySelectorAll('[data-role="period"]').forEach((p, i) => {
          p.querySelector('[data-role="open"]').value = periods[i].open || "";
          p.querySelector('[data-role="close"]').value = periods[i].close || "";
          wirePeriodRemove(p);
        });
        periodsWrap.querySelector('[data-role="remove-period"]').classList.toggle("is-hidden", periods.length < 2);
        addPeriodBtn.classList.toggle("is-hidden", periods.length >= 2);
        syncPeriodInputs();
      },
    };
    exceptions.push(entry);
    if (prefill) entry.setData(prefill);
    return entry;
  }

  addExceptionBtn.addEventListener("click", () => addException());

  // ---- Summary line (shown collapsed) -------------------------------------
  function updateSummary() {
    const hasPrimary = primaryClosed.checked || (primaryOpen.value && primaryClose.value);
    if (!hasPrimary && !exceptions.length) {
      summaryText.textContent = "Add your hours";
      summaryText.classList.add("is-placeholder");
      return;
    }
    summaryText.classList.remove("is-placeholder");
    const primaryLabel = primaryClosed.checked
      ? "Closed"
      : `${formatTime(primaryOpen.value)} – ${formatTime(primaryClose.value)}`;
    const extra = exceptions.length ? ` · ${exceptions.length} exception${exceptions.length === 1 ? "" : "s"}` : "";
    summaryText.textContent = `Every day · ${primaryLabel}${extra}`;
  }

  updateSummary();

  // Attach a getter used by the wizard to read the full Mon-Sun schedule
  container._hoursApi = {
    getSchedule() {
      const primary = primaryClosed.checked
        ? { closed: true }
        : { closed: false, open: primaryOpen.value, close: primaryClose.value };
      const schedule = {};
      DAYS.forEach((d) => (schedule[d] = { ...primary }));
      exceptions.forEach((entry) => {
        const data = entry.getData();
        data.days.forEach((d) => {
          if (data.closed) {
            schedule[d] = { closed: true };
          } else {
            const [first] = data.periods;
            schedule[d] = { closed: false, open: first?.open || "", close: first?.close || "", periods: data.periods };
          }
        });
      });
      return schedule;
    },
    setSchedule(schedule) {
      if (!schedule) return;
      // Group days by matching schedule so equal days collapse back into
      // either the primary "every day" row or a single shared exception.
      const groups = [];
      DAYS.forEach((day) => {
        const val = schedule[day] || { closed: false, open: "", close: "" };
        const sig = val.closed ? "closed" : JSON.stringify(val.periods || [{ open: val.open, close: val.close }]);
        const group = groups.find((g) => g.sig === sig);
        if (group) group.days.push(day);
        else groups.push({ sig, days: [day], sample: val });
      });
      groups.sort((a, b) => b.days.length - a.days.length);
      const [primaryGroup, ...rest] = groups;

      exceptions.splice(0).forEach((entry) => entry.element.remove());

      if (primaryGroup) {
        primaryClosed.checked = Boolean(primaryGroup.sample.closed);
        primaryOpen.value = primaryGroup.sample.closed ? "" : primaryGroup.sample.open || "";
        primaryClose.value = primaryGroup.sample.closed ? "" : primaryGroup.sample.close || "";
        syncPrimaryDisabled();
      }
      rest.forEach((group) => {
        addException({
          days: group.days,
          closed: Boolean(group.sample.closed),
          periods: group.sample.periods,
          open: group.sample.open,
          close: group.sample.close,
        });
      });
      updateSummary();
      if (rest.length) {
        body.classList.remove("is-hidden");
        summaryToggle.classList.add("is-open");
      }
    },
  };
}

// Returns a plain-object Mon-Sun schedule (each day: { closed } or
// { closed:false, open, close, periods? }), useful for review/carry-over.
export function getBusinessHoursValue(container) {
  return container._hoursApi ? container._hoursApi.getSchedule() : {};
}

// Restores a schedule previously read with getBusinessHoursValue. Safe to
// call any time after renderBusinessHours.
export function setBusinessHoursValue(container, schedule) {
  if (container._hoursApi) container._hoursApi.setSchedule(schedule);
}
