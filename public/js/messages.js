document.addEventListener('DOMContentLoaded', function () {
  const messagesList = document.getElementById('messagesList');
  if (messagesList) {
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  const form = document.getElementById('sendMessageForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const content = formData.get('content');

      if (!content.trim()) return;

      try {
        const response = await fetch('/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': formData.get('_csrf'),
          },
          body:
            'receiverId=' +
            encodeURIComponent(formData.get('receiverId')) +
            '&content=' +
            encodeURIComponent(content),
        });

        const result = await response.json();

        if (result.success) {
          window.location.reload();
        } else {
          alert('Failed to send message: ' + result.error);
        }
      } catch (err) {
        console.error('Error sending message:', err);
        alert('Failed to send message');
      }
    });
  }
});

async function unmatchUser(otherUserId) {
  if (
    !confirm('Are you sure you want to unmatch? This will delete your conversation with this user.')
  ) {
    return;
  }

  try {
    const csrfToken = document.querySelector('input[name="_csrf"]')?.value;
    if (!csrfToken) {
      alert('CSRF token not found');
      return;
    }

    const response = await fetch('/messages/unmatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken,
      },
      body: 'otherUserId=' + otherUserId,
    });

    const result = await response.json();
    if (result.success) {
      window.location.href = '/messages';
    } else {
      alert('Failed to unmatch: ' + result.error);
    }
  } catch (err) {
    console.error('Error unmatching:', err);
    alert('Failed to unmatch');
  }
}

async function blockUser(otherUserId) {
  if (
    !confirm(
      'Are you sure you want to block this user? This will delete your conversation and prevent further contact.',
    )
  ) {
    return;
  }

  try {
    const csrfToken = document.querySelector('input[name="_csrf"]')?.value;
    if (!csrfToken) {
      alert('CSRF token not found');
      return;
    }

    const response = await fetch('/messages/block', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken,
      },
      body: 'otherUserId=' + otherUserId,
    });

    const result = await response.json();
    if (result.success) {
      window.location.href = '/messages';
    } else {
      alert('Failed to block user: ' + result.error);
    }
  } catch (err) {
    console.error('Error blocking user:', err);
    alert('Failed to block user');
  }
}
