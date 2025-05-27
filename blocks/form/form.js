import createField from "./form-fields.js";

async function createForm(formHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement("form");

  const fields = await Promise.all(
    json.data.map((fd) => createField(fd, form))
  );

  fields.forEach((field) => {
    if (field) {
      // Add required to inputs, selects, textareas
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

// Simulate form submission
function simulateSubmit(form, block) {
  const payload = generatePayload(form);

  console.log("Simulated payload:", payload); // You can remove this

  // Show success message
  block.innerHTML = `
    <div class="form-success">
      <p><strong>Thanks for submitting!</strong></p>
    </div>
  `;

  // Reload after 3 seconds
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

export default async function decorate(block) {
  const links = [...block.querySelectorAll("a")].map((a) => a.href);
  const formLink = links.find(
    (link) => link.startsWith(window.location.origin) && link.endsWith(".json")
  );

  if (!formLink) return;

  const form = await createForm(formLink);
  block.replaceChildren(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      simulateSubmit(form, block);
    } else {
      const firstInvalidEl = form.querySelector(":invalid:not(fieldset)");
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
}
