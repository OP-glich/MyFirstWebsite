'use strict';

const form = document.getElementById('registration-form');
const panels = Array.from(form.querySelectorAll('fieldset'));
const steps = Array.from(document.querySelectorAll('.steps li'));
const next = document.getElementById('next');
const back = document.getElementById('back');
const error = document.getElementById('form-error');
let currentStep = 0;
let receipt = null;
const fieldLabels = {
  firstName: 'First name', lastName: 'Last name', email: 'Email address',
  phone: 'Phone number', birthDate: 'Date of birth', address: 'Home address',
  program: 'Program', qualification: 'Highest qualification', studyMode: 'Study mode',
  school: 'Previous institution', notes: 'Additional notes'
};

const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document.getElementById('birthDate').max = localDate;
document.getElementById('year').textContent = today.getFullYear();
// JavaScript validates only the visible panel; HTML constraints still describe each field.
form.noValidate = true;

function validatePanel(index) {
  for (const input of panels[index].querySelectorAll('input, select, textarea')) {
    input.setCustomValidity('');
    if (input.required && input.type !== 'checkbox' && !input.value.trim()) {
      input.setCustomValidity('Please complete this field.');
    }
    if (input.name === 'phone' && input.value && !/^[+\d\s().-]{7,25}$/.test(input.value)) {
      input.setCustomValidity('Please enter a valid phone number using 7–15 digits.');
    }
    if (input.name === 'phone' && input.value && (input.value.replace(/\D/g, '').length < 7 || input.value.replace(/\D/g, '').length > 15)) {
      input.setCustomValidity('Please enter a phone number with 7–15 digits.');
    }
    if (!input.checkValidity()) {
      input.reportValidity();
      input.focus();
      return false;
    }
  }
  return true;
}

function collectDetails() {
  return Object.fromEntries(Object.keys(fieldLabels).map(name => [name, form.elements.namedItem(name).value.trim()]));
}

function renderReview() {
  const review = document.getElementById('review');
  review.replaceChildren();
  for (const [key, value] of Object.entries(collectDetails())) {
    if (!value) continue;
    const row = document.createElement('div');
    const label = document.createElement('dt');
    const detail = document.createElement('dd');
    label.textContent = fieldLabels[key];
    detail.textContent = value;
    row.append(label, detail);
    review.append(row);
  }
}

function showStep(index, focus = true) {
  currentStep = index;
  panels.forEach((panel, i) => { panel.hidden = i !== index; });
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === index);
    step.classList.toggle('done', i < index);
    if (i === index) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });
  document.getElementById('step-caption').textContent = `Step ${index + 1} of 3`;
  back.hidden = index === 0;
  next.replaceChildren(document.createTextNode(['Continue to academic details', 'Review your registration', 'Complete registration'][index]));
  const arrow = document.createElement('span');
  arrow.textContent = index === 2 ? '✓' : '→';
  next.append(arrow);
  error.hidden = true;
  if (index === 2) renderReview();
  if (focus) {
    const legend = panels[index].querySelector('legend');
    legend.tabIndex = -1;
    legend.focus();
  }
}

form.addEventListener('input', event => {
  if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
});
back.addEventListener('click', () => showStep(currentStep - 1));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validatePanel(currentStep)) return;
  if (currentStep < 2) { showStep(currentStep + 1); return; }
  // Recheck earlier panels before producing the receipt.
  for (let i = 0; i < 2; i++) {
    showStep(i, false);
    if (!validatePanel(i)) return;
  }
  showStep(2, false);
  receipt = {
    reference: `NS-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'Local demonstration — not submitted to an institution',
    student: collectDetails()
  };
  form.hidden = true;
  document.querySelector('.steps').hidden = true;
  document.getElementById('step-caption').textContent = 'Complete';
  document.getElementById('form-title').textContent = 'A new beginning.';
  document.querySelector('.subtitle').textContent = 'Keep a copy of your details for your records.';
  document.getElementById('reference').textContent = `Receipt reference: ${receipt.reference}`;
  document.getElementById('success').hidden = false;
  const heading = document.querySelector('.success h3');
  heading.tabIndex = -1;
  heading.focus();
});

document.getElementById('download').addEventListener('click', () => {
  if (!receipt) return;
  const lines = ['NORTHSTAR — STUDENT REGISTRATION RECEIPT', '', `Reference: ${receipt.reference}`, `Created: ${receipt.createdAt}`, receipt.status, '', ...Object.entries(receipt.student).map(([key, value]) => `${fieldLabels[key]}: ${value || 'Not provided'}`)];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `northstar-${receipt.reference}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('restart').addEventListener('click', () => {
  form.reset();
  receipt = null;
  form.hidden = false;
  document.querySelector('.steps').hidden = false;
  document.getElementById('success').hidden = true;
  document.getElementById('form-title').textContent = 'Let’s get you started.';
  document.querySelector('.subtitle').textContent = 'Tell us a little about yourself. Your next chapter awaits.';
  showStep(0);
});
