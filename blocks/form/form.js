import createField from "./form-fields.js";

async function createForm(formHref, submitHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement("form");
  form.dataset.action = submitHref;

  const fields = await Promise.all(
    json.data.map((fd) => createField(fd, form))
  );

  fields.forEach((field) => {
    if (field) {
      // Mark required fields
      field.querySelectorAll?.("input, select, textarea").forEach((el) => {
        if (
          el.type !== "submit" &&
          el.type !== "button" &&
          el.type !== "hidden"
        ) {
          el.required = true;
        }
      });
      form.append(field);
    }
  });

  // group fields into fieldsets (optional if using fieldsets)
  const fieldsets = form.querySelectorAll("fieldset");
  fieldsets.forEach((fieldset) => {
    form
      .querySelectorAll(`[data-fieldset="${fieldset.name}"`)
      .forEach((field) => {
        fieldset.append(field);
      });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== "submit" && !field.disabled) {
      if (field.type === "radio") {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === "checkbox") {
        if (field.checked)
          payload[field.name] = payload[field.name]
            ? `${payload[field.name]},${field.value}`
            : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });

  return payload;
}

async function handleSubmit(form, block) {
  if (form.getAttribute("data-submitting") === "true") return;

  const submit = form.querySelector(
    'button[type="submit"], input[type="submit"]'
  );
  try {
    form.setAttribute("data-submitting", "true");
    if (submit) submit.disabled = true;

    // create payload
    const payload = generatePayload(form);

    const response = await fetch(form.dataset.action, {
      method: "POST",
      body: JSON.stringify({ data: payload }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // show success message
      block.innerHTML = "<p><strong>Thanks for submitting!</strong></p>";

      // reload form after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    console.error("Submission failed:", e);
  } finally {
    form.setAttribute("data-submitting", "false");
    if (submit) submit.disabled = false;
  }
}

export default async function decorate(block) {
  const links = [...block.querySelectorAll("a")].map((a) => a.href);
  const formLink = links.find(
    (link) => link.startsWith(window.location.origin) && link.endsWith(".json")
  );
  const submitLink = links.find((link) => link !== formLink);

  if (!formLink || !submitLink) return;

  const form = await createForm(formLink, submitLink);
  block.replaceChildren(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form, block);
    } else {
      const firstInvalidEl = form.querySelector(":invalid:not(fieldset)");
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
}
