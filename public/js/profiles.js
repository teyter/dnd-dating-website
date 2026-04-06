document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form[method="POST"]').forEach((form) => {
    form.addEventListener('submit', function (e) {
      const csrfInput = form.querySelector('input[name="_csrf"]');
      if (csrfInput) {
        e.preventDefault();
        const formData = new FormData(form);
        const csrfToken = csrfInput.value;

        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
          .then((response) => {
            if (response.ok || response.redirected) {
              window.location.reload();
            } else {
              alert('Error: ' + response.statusText);
            }
          })
          .catch((err) => {
            alert('Error: ' + err.message);
          });
      }
    });
  });
});
