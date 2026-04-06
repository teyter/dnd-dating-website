document.addEventListener('DOMContentLoaded', function () {
  const multipartForms = document.querySelectorAll('form[enctype="multipart/form-data"]');
  multipartForms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      const csrfInput = form.querySelector('input[name="_csrf"]');
      if (!csrfInput) {
        console.error('No CSRF input found in form');
        return;
      }

      const csrfToken = csrfInput.value;
      console.log(
        'Submitting form to:',
        form.action,
        'with CSRF token:',
        csrfToken ? 'present' : 'missing',
      );

      // Let the form submit normally - CSRF token is in the hidden input
      // Remove any custom fetch handling
    });
  });
});
