document.addEventListener('DOMContentLoaded', function () {
  const multipartForms = document.querySelectorAll('form[enctype="multipart/form-data"]');
  multipartForms.forEach((form) => {
    form.addEventListener('submit', function (e) {
      const csrfToken = form.querySelector('input[name="_csrf"]').value;
      e.preventDefault();

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })
        .then((response) => {
          if (response.redirected) {
            window.location.href = response.url;
          } else if (response.ok) {
            window.location.reload();
          } else {
            alert('Error: ' + response.statusText);
          }
        })
        .catch((err) => {
          alert('Error: ' + err.message);
        });
    });
  });
});
