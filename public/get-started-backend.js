(() => {
  const form = document.querySelector('main form');
  const roleButtons = document.querySelectorAll('main .grid-cols-2 button');
  let role = 'brand';

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      role = button.textContent.toLowerCase().includes('creator') ? 'creator' : 'brand';

      roleButtons.forEach((roleButton) => {
        const selected = roleButton === button;
        roleButton.classList.toggle('border-primary', selected);
        roleButton.classList.toggle('bg-accent', selected);
        roleButton.classList.toggle('text-accent-foreground', selected);
        roleButton.classList.toggle('bg-card', !selected);
      });

      const nameLabel = form?.querySelector('label[for="n"]');
      if (nameLabel) nameLabel.textContent = role === 'creator' ? 'Full name' : 'Brand / your name';
    });
  });

  document.addEventListener('submit', async (event) => {
    const submittedForm = event.target;
    if (!(submittedForm instanceof HTMLFormElement) || submittedForm !== form) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (submittedForm.dataset.backendSignupSubmitting === 'true') return;

    const fullName = submittedForm.querySelector('#n')?.value.trim();
    const email = submittedForm.querySelector('#e')?.value.trim();
    const password = submittedForm.querySelector('#p')?.value;
    const submitButton = submittedForm.querySelector('button[type="submit"]');

    let status = submittedForm.querySelector('[data-signup-status]');
    if (!status) {
      status = document.createElement('p');
      status.dataset.signupStatus = '';
      status.className = 'text-sm text-destructive';
      status.setAttribute('role', 'alert');
      submittedForm.append(status);
    }

    if (!fullName || !email || !password || password.length < 6) {
      status.textContent = 'Enter your name, a valid email, and a password of at least 6 characters.';
      return;
    }

    submittedForm.dataset.backendSignupSubmitting = 'true';
    if (submitButton) submitButton.disabled = true;
    status.textContent = '';

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
          ...(role === 'brand' ? { company_name: fullName } : {}),
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Account creation failed. Please try again.');
      }

      window.location.assign(role === 'brand' ? '/brand' : '/studio');
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Unable to connect to the server.';
    } finally {
      delete submittedForm.dataset.backendSignupSubmitting;
      if (submitButton) submitButton.disabled = false;
    }
  }, true);
})();