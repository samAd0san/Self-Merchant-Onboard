// ==========================================================================
// Component: OTP Input
// Six-digit verification code split across individual boxes, with
// auto-advance on type, backspace-to-previous, paste support, and an
// onComplete callback fired the instant all boxes are filled this is
// what powers auto-submit so the user never has to click "Verify".
// ==========================================================================

import { qsa } from "../utils/dom.js";

export function initOtpInput(containerSelector, { onComplete } = {}) {
  const boxes = qsa(`${containerSelector} .otp-input__box`);

  function focusBox(index) {
    if (boxes[index]) {
      boxes[index].focus();
      boxes[index].select();
    }
  }

  function isComplete() {
    return boxes.length > 0 && boxes.every((box) => box.value.length === 1);
  }

  function notifyIfComplete() {
    if (isComplete() && typeof onComplete === "function") {
      onComplete();
    }
  }

  boxes.forEach((box, index) => {
    // Keep only a single numeric character per box
    box.addEventListener("input", () => {
      box.value = box.value.replace(/[^0-9]/g, "").slice(0, 1);
      if (box.value && index < boxes.length - 1) {
        focusBox(index + 1);
      }
      notifyIfComplete();
    });

    // Backspace on an empty box jumps focus back to the previous one
    box.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !box.value && index > 0) {
        focusBox(index - 1);
      }
    });

    // Support pasting the full code at once across all boxes
    box.addEventListener("paste", (event) => {
      event.preventDefault();
      const digits = (event.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
      digits.split("").forEach((digit, digitIndex) => {
        if (boxes[digitIndex]) {
          boxes[digitIndex].value = digit;
        }
      });
      focusBox(Math.min(digits.length, boxes.length - 1));
      notifyIfComplete();
    });
  });

  return {
    getValue: () => boxes.map((box) => box.value).join(""),
    reset: () => {
      boxes.forEach((box) => (box.value = ""));
      focusBox(0);
    },
  };
}
